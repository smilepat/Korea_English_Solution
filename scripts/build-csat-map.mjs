// scripts/build-csat-map.mjs
// 성취기준 ↔ 수능 문항유형 "참고" 매핑(규칙 기반). ⚠️ 공인 매핑 아님 — 성취기준 문구 키워드 규칙.
// 대상: high + 읽기/이해 영역만(수능 읽기유형과 관련). 듣기·말하기·쓰기는 매핑 안 함.
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path"
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const env = {}; if (existsSync(join(ROOT, ".env.local"))) for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2] }
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: (env.TURSO_AUTH_TOKEN || "").replace(/[^A-Za-z0-9._-]/g, "") })
const Q = async (s, a = []) => (await db.execute({ sql: s, args: a })).rows

// 규칙: [정규식, 수능유형, 신뢰도]
const RULES = [
  [/주제|요지|제목|중심 ?내용|핵심/, "주제·요지·제목", "high"],
  [/요약/, "요약(문단요약)", "high"],
  [/함축|문맥.*의미|빈칸|낱말.*추론|어구.*추론/, "빈칸추론", "medium"],
  [/순서|전개|흐름|응집|연결|글의 구조|일이나 사건의 순서/, "글의 순서·문장삽입", "medium"],
  [/무관|관계없는|어색한/, "무관한 문장", "medium"],
  [/심정|심경|분위기|어조|태도|기분/, "심경·분위기", "high"],
  [/지칭|가리키는|대명사/, "지칭 추론", "medium"],
  [/세부 ?정보|구체적 ?정보/, "세부정보(내용일치)", "high"],
  [/도표|그림|실용문|안내문|광고/, "도표·실용문", "medium"],
]

async function main() {
  await db.execute(`CREATE TABLE IF NOT EXISTS kcsdb_csat_type_map (
    standard_id TEXT, csat_type TEXT, confidence TEXT, rationale_ko TEXT,
    PRIMARY KEY (standard_id, csat_type))`)
  await db.execute("DELETE FROM kcsdb_csat_type_map")

  const rows = await Q(`SELECT standard_id, standard_text_ko FROM kcsdb_standards
    WHERE grade_band='high' AND (domain_name_ko IN ('읽기','이해'))`)
  let n = 0, covered = new Set()
  for (const r of rows) {
    const text = String(r.standard_text_ko || "")
    for (const [re, type, conf] of RULES) {
      const m = text.match(re)
      if (m) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO kcsdb_csat_type_map (standard_id, csat_type, confidence, rationale_ko) VALUES (?,?,?,?)`,
          args: [r.standard_id, type, conf, `성취기준 문구 '${m[0]}' 규칙 매핑(참고)`],
        })
        n++; covered.add(r.standard_id)
      }
    }
  }
  console.log(`[csat-map] 대상 고교 읽기/이해 ${rows.length}건 중 ${covered.size}건에 ${n}개 유형 매핑(규칙·참고)`)
  for (const t of await Q("SELECT csat_type, COUNT(*) c FROM kcsdb_csat_type_map GROUP BY 1 ORDER BY 2 DESC"))
    console.log(`   ${t.csat_type}: ${t.c}`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })

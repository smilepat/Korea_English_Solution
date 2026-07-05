// scripts/backfill-cefr.mjs
// CEFR 결측(338/672) 백필: 같은 학년군·영역 보유분에서 최빈 CEFR 상속 → 없으면 학년군 기본값.
// cefr_source 컬럼으로 출처 구분(original|inherited|estimated). UI에서 "추정" 표기.
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path"
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const env = {}; if (existsSync(join(ROOT, ".env.local"))) for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2] }
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: (env.TURSO_AUTH_TOKEN || "").replace(/[^A-Za-z0-9._-]/g, "") })
const Q = async (s, a = []) => (await db.execute({ sql: s, args: a })).rows

const BAND_DEFAULT = { elementary: "A1", middle: "A2", high: "B1" }

async function main() {
  // 1) cefr_source 컬럼(없으면 추가)
  try { await db.execute("ALTER TABLE kcsdb_standards ADD COLUMN cefr_source TEXT") } catch { /* 이미 있음 */ }
  await db.execute("UPDATE kcsdb_standards SET cefr_source='original' WHERE cefr_alignment IS NOT NULL AND cefr_alignment!='' AND (cefr_source IS NULL OR cefr_source='')")

  // 2) 결측 목록
  const missing = await Q("SELECT standard_id, curriculum_version, grade_band, domain_name_ko FROM kcsdb_standards WHERE cefr_alignment IS NULL OR cefr_alignment=''")
  console.log(`[backfill] 결측 ${missing.length}건 처리...`)

  // 3) (version,band,domain) 최빈 CEFR 캐시
  const modeCache = new Map()
  async function majority(v, b, d) {
    const key = `${v}|${b}|${d}`
    if (modeCache.has(key)) return modeCache.get(key)
    const r = await Q(`SELECT cefr_alignment c FROM kcsdb_standards WHERE curriculum_version=? AND grade_band=? AND domain_name_ko=? AND cefr_alignment!='' GROUP BY cefr_alignment ORDER BY COUNT(*) DESC LIMIT 1`, [v, b, d])
    const val = r[0]?.c || null; modeCache.set(key, val); return val
  }

  let inherited = 0, estimated = 0
  for (const m of missing) {
    let cefr = await majority(m.curriculum_version, m.grade_band, m.domain_name_ko)
    let src = "inherited"
    if (!cefr) { cefr = BAND_DEFAULT[m.grade_band] || "B1"; src = "estimated" }
    await db.execute({ sql: "UPDATE kcsdb_standards SET cefr_alignment=?, cefr_source=? WHERE standard_id=?", args: [cefr, src, m.standard_id] })
    if (src === "inherited") inherited++; else estimated++
  }
  console.log(`[backfill] 완료: 상속 ${inherited} · 추정(학년군기본값) ${estimated}`)
  for (const r of await Q("SELECT cefr_source, COUNT(*) n FROM kcsdb_standards GROUP BY cefr_source"))
    console.log(`   ${r.cefr_source}: ${r.n}`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })

// scripts/embed-kcsdb.mjs
// kcsdb_standards → Gemini text-embedding-004(768d) → kcsdb_vec (S3 의미검색)
// 실행: node scripts/embed-kcsdb.mjs
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
function loadEnv() {
  const p = join(ROOT, ".env.local"); if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
  }
}
loadEnv()
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: (process.env.TURSO_AUTH_TOKEN || "").replace(/[^A-Za-z0-9._-]/g, ""),
})
const KEY = process.env.GEMINI_API_KEY
if (!KEY) { console.error("GEMINI_API_KEY 필요"); process.exit(1) }

async function embed(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${KEY}`
  for (let a = 0; a < 4; a++) {
    try {
      const res = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "models/gemini-embedding-001", content: { parts: [{ text: text.slice(0, 2000) }] }, outputDimensionality: 768 }),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 100))
      const d = await res.json()
      return d.embedding?.values || []
    } catch (e) { if (a === 3) throw e; await new Promise(r => setTimeout(r, 1500 * (a + 1))) }
  }
}

async function main() {
  const std = (await db.execute(
    `SELECT s.standard_id, s.curriculum_version, s.grade_band, s.subject_name_ko, s.domain_name_ko,
            s.cefr_alignment, s.standard_text_ko,
            (SELECT GROUP_CONCAT(level||':'||substr(descriptor_ko,1,60),' ') FROM kcsdb_levels l
              WHERE l.standard_id=s.standard_id) AS levels
     FROM kcsdb_standards s`)).rows
  console.log(`[embed] ${std.length}개 성취기준 임베딩(768d)...`)
  let n = 0
  for (const r of std) {
    const doc = `${r.curriculum_version} 개정 ${r.grade_band} ${r.subject_name_ko || ""} ${r.domain_name_ko || ""} 영역 성취기준. ` +
      `${r.standard_id}: ${r.standard_text_ko}. ${r.cefr_alignment ? "CEFR " + r.cefr_alignment + ". " : ""}` +
      `${r.levels ? "성취수준: " + r.levels : ""}`
    const v = await embed(doc)
    if (v.length) {
      await db.execute({ sql: "INSERT OR REPLACE INTO kcsdb_vec (standard_id, embedding) VALUES (?, vector32(?))",
        args: [r.standard_id, `[${v.join(",")}]`] })
      n++
    }
    if (n % 50 === 0) console.log(`  ${n}/${std.length}`)
  }
  console.log(`[embed] 완료: kcsdb_vec ${n}행. 벡터인덱스 생성...`)
  try { await db.execute("CREATE INDEX IF NOT EXISTS idx_kcsdb_vec ON kcsdb_vec (libsql_vector_idx(embedding))") } catch (e) { console.log("  (인덱스 생략:", e.message?.slice(0,60), ")") }
  console.log("[embed] S3 의미검색 준비 완료.")
}
main().catch(e => { console.error(e); process.exit(1) })

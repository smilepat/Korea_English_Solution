// scripts/migrate-generated-items.mjs
// kcsdb_generated_items 테이블을 라이브 Turso에 생성(재시드 없이 일회성).
// 다른 kcsdb 운영 테이블과 동일 방식. 멱등(IF NOT EXISTS).
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path"
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const env = {}; if (existsSync(join(ROOT, ".env.local"))) for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "") }
const db = createClient({ url: env.TURSO_DATABASE_URL.replace(/[^A-Za-z0-9:/._-]/g, ""), authToken: (env.TURSO_AUTH_TOKEN || "").replace(/[^A-Za-z0-9._-]/g, "") })

const DDL = [
  `CREATE TABLE IF NOT EXISTS kcsdb_generated_items (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    standard_id        TEXT,
    curriculum_version TEXT,
    grade_band         TEXT,
    domain_name_ko     TEXT,
    cefr               TEXT,
    item_type          TEXT,
    difficulty         TEXT,
    payload            TEXT,
    model              TEXT,
    source             TEXT DEFAULT 'ai',
    created_at         TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_kcsdb_geni_std ON kcsdb_generated_items(standard_id, created_at DESC)`,
]

async function main() {
  for (const sql of DDL) await db.execute(sql)
  const c = await db.execute("SELECT COUNT(*) c FROM kcsdb_generated_items")
  console.log(`[migrate] kcsdb_generated_items 준비 완료 · 현재 ${Number(c.rows[0].c)}건`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })

// scripts/run-kes-schema.mjs
// kes_* 학생 척추 스키마 적용. 멱등(IF NOT EXISTS)이라 반복 실행해도 안전하다.
//
// 실행: node scripts/run-kes-schema.mjs
// env 없으면 file:./local.db 에 적용한다(로컬 개발/테스트용).
//
// 주의: 운영 DB 는 `connectedu` org 소속이다. 토큰 발급 시 org 전환 필요.
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, "..")

// --- .env.local 로드 (seed-kcsdb.mjs 와 동일한 처리) ---
function loadEnv() {
  const p = join(ROOT, ".env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
  }
}
loadEnv()

const url = process.env.TURSO_DATABASE_URL
const authToken = (process.env.TURSO_AUTH_TOKEN || "").replace(/[^A-Za-z0-9._-]/g, "")

let db
if (url && authToken) {
  console.log(`[kes-schema] 원격 Turso 에 적용: ${url}`)
  db = createClient({ url, authToken })
} else {
  console.log("[kes-schema] TURSO env 없음 → file:./local.db 에 적용")
  db = createClient({ url: "file:./local.db" })
}

// 모든 kes_ 마이그레이션을 순서대로 적용한다(멱등이라 반복 안전).
const MIGRATIONS = [
  "005-kes-core-schema.sql",
  "006-kes-cat-sessions.sql",
  "007-kes-content-schema.sql",
]

let applied = 0
for (const file of MIGRATIONS) {
  const sql = readFileSync(join(__dir, file), "utf8")
  // 주석 제거 후 세미콜론 단위 분리
  // (이 스키마들에는 문자열 리터럴 안의 세미콜론이 없어 단순 분할로 충분하다)
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    try {
      await db.execute(stmt)
      applied++
    } catch (err) {
      console.error(`\n[kes-schema] ${file} 실패한 구문:\n${stmt}\n`)
      throw err
    }
  }
}

// 검증: 기대한 테이블이 실제로 생겼는지 COUNT 로 확인한다.
// ("완료"는 DB 확인 후에만 기재한다는 원칙)
const expected = [
  "kes_classes",
  "kes_students",
  "kes_enrollments",
  "kes_diagnosis_snapshots",
  "kes_lexile_results",
  "kes_problems",
  "kes_cat_sessions",
  "kes_passages",
  "kes_vocab_master",
  "kes_vocab_cards",
  "kes_worksheets",
]
const found = await db.execute(
  `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'kes_%' ORDER BY name`,
)
const foundNames = found.rows.map((r) => String(r.name))
const missing = expected.filter((t) => !foundNames.includes(t))

console.log(`[kes-schema] 구문 ${applied}개 적용`)
console.log(`[kes-schema] kes_* 테이블: ${foundNames.join(", ") || "(없음)"}`)

if (missing.length > 0) {
  console.error(`[kes-schema] ✗ 누락된 테이블: ${missing.join(", ")}`)
  process.exit(1)
}
console.log("[kes-schema] ✓ 전체 테이블 확인됨")

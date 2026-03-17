import { createClient } from "@libsql/client"

const turso = createClient({
  url: "libsql://korea-english-solution-2026-connectedu.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzMxMjg0MjEsImlkIjoiMDE5Y2Q2YjAtNmUwMS03NjEwLTk2NmEtYzc0NjY3MGNmMzg0IiwicmlkIjoiMjM0OWNhYmItODFlYy00M2QxLWI5NGYtNDcwNjg3YjIxNzQ3In0.-UMlrKbCt-BXYEH2dBdw4LISO7Nztd8_xf7KomFl7E0R7sV1FFhG9W97_W5OwOMHdCPKCc_QKPJ3OfTqbyJ4Cw",
})

const statements = [
  `CREATE TABLE IF NOT EXISTS reading_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    lexile_level INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    topic TEXT,
    genre TEXT,
    questions TEXT,
    vocabulary TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS reading_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL DEFAULT 'demo',
    material_id INTEGER,
    words_read INTEGER NOT NULL,
    score INTEGER,
    reading_date TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS conversation_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT DEFAULT 'demo',
    scenario TEXT NOT NULL,
    cefr_level TEXT NOT NULL,
    messages TEXT NOT NULL,
    evaluation TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS rubrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT DEFAULT 'demo',
    grade TEXT NOT NULL,
    skill TEXT NOT NULL,
    topic TEXT NOT NULL,
    cefr_target TEXT,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reading_materials_lexile ON reading_materials (lexile_level)`,
  `CREATE INDEX IF NOT EXISTS idx_reading_logs_student ON reading_logs (student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conversation_cefr ON conversation_sessions (cefr_level)`,
  `CREATE INDEX IF NOT EXISTS idx_rubrics_grade_skill ON rubrics (grade, skill)`,
]

console.log("Phase 4 스키마 실행 중...")

for (const sql of statements) {
  try {
    await turso.execute(sql)
    const name = sql.match(/(?:TABLE|INDEX)\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1]
    console.log(`  ✅ ${name}`)
  } catch (e) {
    console.error(`  ❌ 오류:`, e.message)
  }
}

// 검증
const tables = await turso.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
console.log(`\n총 테이블: ${tables.rows.length}개`)
tables.rows.forEach(r => console.log(`  📋 ${r.name}`))

const indexes = await turso.execute("SELECT name FROM sqlite_master WHERE type='index' ORDER BY name")
console.log(`총 인덱스: ${indexes.rows.length}개`)

turso.close()
console.log("\n✅ Phase 4 스키마 완료!")

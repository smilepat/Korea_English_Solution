// scripts/seed-content.mjs
// data/ vendored 스냅샷 → Turso kes_ 콘텐츠 테이블 시드.
// 실행: node scripts/seed-content.mjs
// env 없으면 file:./local.db.
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, "..")

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
const db = url && authToken ? createClient({ url, authToken }) : createClient({ url: "file:./local.db" })
console.log(`[seed] ${url && authToken ? "원격 Turso" : "file:./local.db"}`)

function readJsonl(rel) {
  const p = join(ROOT, rel)
  if (!existsSync(p)) throw new Error(`스냅샷 없음: ${rel} — 먼저 node scripts/export-content.mjs`)
  return readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l))
}

// 배치 삽입(멱등: INSERT OR REPLACE)
async function seedBatch(rows, sql, toArgs, label) {
  const CHUNK = 200
  let done = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK)
    await db.batch(slice.map((r) => ({ sql, args: toArgs(r) })))
    done += slice.length
  }
  console.log(`[seed] ${label}: ${done}개`)
  return done
}

// ── 지문 (창작 원본 + AI 생성 초등 보강 lane) ──
const passages = readJsonl("data/passages/passages.jsonl")
if (existsSync(join(ROOT, "data/passages/generated_elementary.jsonl"))) {
  passages.push(...readJsonl("data/passages/generated_elementary.jsonl"))
}
await seedBatch(
  passages,
  `INSERT OR REPLACE INTO kes_passages
     (text_id, lexile_score, lexile_band, age_group, grade_hint, grade_band, genre, topic,
      word_count, sentence_count, vocabulary_band, intended_use, text_body, source, license)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  (r) => [
    r.text_id, r.lexile_score, r.lexile_band, r.age_group, r.grade_hint, r.grade_band,
    r.genre, r.topic, r.word_count, r.sentence_count, r.vocabulary_band, r.intended_use,
    r.text_body, r.source, r.license,
  ],
  "passages",
)

// ── 어휘 마스터 ──
const vocab = readJsonl("data/vocab/vocab_min.jsonl")
await seedBatch(
  vocab,
  `INSERT OR REPLACE INTO kes_vocab_master
     (word_id, word, pos, meaning_ko, cefr, kr_curriculum, grade_range_norm, lexile_band,
      us_grade, in_curriculum, irt, source)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  (r) => [
    r.word_id, r.word, r.pos, r.meaning_ko, r.cefr, r.kr_curriculum, r.grade_range_norm,
    r.lexile_band, r.us_grade, r.in_curriculum, r.irt ? JSON.stringify(r.irt) : null, r.source,
  ],
  "vocab_master",
)

// ── 설계맥락 카드 ──
const cards = readJsonl("data/vocab/cards_min.jsonl")
await seedBatch(
  cards,
  `INSERT OR REPLACE INTO kes_vocab_cards
     (headword, gloss_ko, colloc_en, colloc_kr, ex_en, ex_kr, level)
   VALUES (?,?,?,?,?,?,?)`,
  (r) => [r.headword, r.gloss_ko, r.colloc_en, r.colloc_kr, r.ex_en, r.ex_kr, r.level],
  "vocab_cards",
)

// ── 검증 COUNT ("완료"는 DB COUNT 확인 후만) ──
for (const [t, expect] of [["kes_passages", passages.length], ["kes_vocab_master", vocab.length], ["kes_vocab_cards", cards.length]]) {
  const n = Number((await db.execute(`SELECT COUNT(*) c FROM ${t}`)).rows[0].c)
  const ok = n >= expect
  console.log(`[seed] ${t} COUNT=${n} ${ok ? "✓" : `✗ (기대 ${expect})`}`)
  if (!ok) process.exit(1)
}
console.log("[seed] 완료")

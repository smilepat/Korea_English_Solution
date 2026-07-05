// scripts/seed-kcsdb.mjs
// Korea-curri-standards-db 정본 CSV(data/kcsdb/*.csv) → Turso kcsdb_* 테이블 시드.
// 실행: node scripts/seed-kcsdb.mjs
// 필요: .env.local 의 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, "..")
const DATA = join(ROOT, "data", "kcsdb")

// --- .env.local 로드(간단) ---
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
if (!url || !authToken) { console.error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 필요"); process.exit(1) }
const db = createClient({ url, authToken })

// --- 최소 CSV 파서(RFC4180: 따옴표 안의 콤마/개행 처리) ---
function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false }
      else field += c
    } else {
      if (c === '"') q = true
      else if (c === ",") { row.push(field); field = "" }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = "" }
      else if (c === "\r") { /* skip */ }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}
function readCsv(name) {
  const raw = readFileSync(join(DATA, name), "utf8").replace(/^﻿/, "")
  const rows = parseCSV(raw).filter(r => r.length > 1)
  const head = rows.shift()
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ""])))
}

async function batchInsert(sql, rows, mapper, label) {
  const B = 100
  let n = 0
  for (let i = 0; i < rows.length; i += B) {
    const stmts = rows.slice(i, i + B).map(r => ({ sql, args: mapper(r) }))
    await db.batch(stmts, "write")
    n += stmts.length
  }
  console.log(`  ${label}: ${n}`)
}

async function main() {
  console.log("[seed] 스키마 적용...")
  const schema = readFileSync(join(__dir, "schema-kcsdb.sql"), "utf8")
    .replace(/^\s*--.*$/gm, "")   // 전체 주석줄 제거(인라인 -- 는 SQLite가 처리)
  for (const stmt of schema.split(";")) {
    const s = stmt.trim()
    if (s) await db.execute(s)
  }

  console.log("[seed] 기존 kcsdb_ 데이터 초기화...")
  for (const t of ["kcsdb_standards","kcsdb_levels","kcsdb_vocab","kcsdb_comm_functions","kcsdb_grammar","kcsdb_sources"])
    await db.execute(`DELETE FROM ${t}`)
  await db.execute("DELETE FROM kcsdb_standards_fts")

  // 1) 성취기준 (verified + stas)
  const stds = [...readCsv("achievement_standards.csv"), ...readCsv("achievement_standards_stas.csv")]
  await batchInsert(
    `INSERT OR REPLACE INTO kcsdb_standards
     (standard_id,curriculum_version,grade_band,grade_level,subject_name_ko,domain_code,domain_name_ko,standard_text_ko,cefr_alignment,verification_status)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    stds, r => [r.standard_id, r.curriculum_version, r.grade_band, r.grade_level, r.subject_name_ko,
                r.domain_code, r.domain_name_ko, r.standard_text_ko, r.cefr_alignment, r.verification_status],
    "kcsdb_standards")

  // FTS 적재
  await batchInsert(
    `INSERT INTO kcsdb_standards_fts (standard_id,standard_text,subject,domain,grade_band,curriculum_version) VALUES (?,?,?,?,?,?)`,
    stds, r => [r.standard_id, r.standard_text_ko, r.subject_name_ko, r.domain_name_ko, r.grade_band, r.curriculum_version],
    "kcsdb_standards_fts")

  // 2) 성취수준
  const lv = readCsv("achievement_levels.csv")
  await batchInsert(
    `INSERT INTO kcsdb_levels (standard_id,scale_type,level,descriptor_ko,cut_score) VALUES (?,?,?,?,?)`,
    lv, r => [r.standard_id || null, r.scale_type, r.level, r.descriptor_ko, r.cut_score], "kcsdb_levels")

  // 3) 어휘 (vocab_curriculum_map: cefr/freq/meaning + curriculum_vocab: marker)
  const marker = new Map()
  for (const r of readCsv("curriculum_vocab.csv")) marker.set(`${r.curriculum_version}|${(r.word||"").toLowerCase()}`, r.level_marker)
  const vmap = readCsv("vocab_curriculum_map.csv")
  await batchInsert(
    `INSERT INTO kcsdb_vocab (word,curriculum_version,level_marker,cefr,freq_rank,meaning_ko) VALUES (?,?,?,?,?,?)`,
    vmap, r => [r.curriculum_word, r.curriculum_version,
                marker.get(`${r.curriculum_version}|${(r.curriculum_word||"").toLowerCase()}`) || null,
                r.cefr || null, r.freq_rank || null, r.meaning_ko || null], "kcsdb_vocab")

  // 4) 의사소통 기능 / 문법
  await batchInsert(`INSERT OR REPLACE INTO kcsdb_comm_functions (id,category_l1,description_ko,curriculum_version) VALUES (?,?,?,?)`,
    readCsv("comm_functions.csv"), r => [r.id, r.category_l1, r.description_ko, r.curriculum_version], "kcsdb_comm_functions")
  await db.execute("DELETE FROM kcsdb_comm_function_examples")
  await batchInsert(`INSERT INTO kcsdb_comm_function_examples (function_id,example_en,elementary_recommended) VALUES (?,?,?)`,
    readCsv("comm_function_examples.csv"), r => [r.function_id, r.example_en, Number(r.elementary_recommended) || 0], "kcsdb_comm_function_examples")
  await batchInsert(`INSERT OR REPLACE INTO kcsdb_grammar (id,example_en,curriculum_version) VALUES (?,?,?)`,
    readCsv("grammar_items.csv"), r => [r.id, r.example_en, r.curriculum_version], "kcsdb_grammar")

  // 5) 소스
  await batchInsert(`INSERT OR REPLACE INTO kcsdb_sources (source_id,title,url,license,commercial_ok) VALUES (?,?,?,?,?)`,
    readCsv("source_registry.csv"), r => [r.source_id, r.title, r.url, r.license, Number(r.commercial_ok) || 0], "kcsdb_sources")

  // 요약
  for (const t of ["kcsdb_standards","kcsdb_levels","kcsdb_vocab","kcsdb_comm_functions","kcsdb_grammar","kcsdb_sources"]) {
    const n = (await db.execute(`SELECT COUNT(*) c FROM ${t}`)).rows[0].c
    console.log(`   ${t} = ${n}`)
  }
  console.log("[seed] 완료. 다음: node scripts/embed-kcsdb.mjs (S3 벡터)")
}
main().catch(e => { console.error(e); process.exit(1) })

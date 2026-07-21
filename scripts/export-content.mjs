// scripts/export-content.mjs
// 원천 레포에서 콘텐츠 스냅샷을 data/ 로 vendoring 한다.
// (data/kcsdb 관례와 동일: 원천을 pin 하고 앱은 vendored 스냅샷을 시드한다)
//
// 실행: node scripts/export-content.mjs
// 원천 경로는 환경/로컬 클론 기준. 다른 PC 에서는 --src 로 재지정.
//
// ★ 저작권: 지문은 reading_text 테이블만 화이트리스트로 읽는다.
//   같은 파일 안의 csat_questions(기출)는 이 스크립트가 아예 건드리지 않는다.
import { createRequire } from "node:module"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const require = createRequire(import.meta.url)
const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, "..")

// 원천 경로(로컬 클론 기준). 필요 시 env 로 재지정.
const SRC = {
  passagesDb:
    process.env.SRC_READING_DB ||
    "C:/tmp/lexile_based_reading_textDB/python-app/reading_text.db",
  vocabJson:
    process.env.SRC_VOCAB_JSON ||
    "C:/tmp/efl-data-hub/data-package/vocab/vocab_full.json",
  cardsJsonl:
    process.env.SRC_CARDS_JSONL ||
    "C:/tmp/vocab-context/out/designed_min_form.jsonl",
}

const OUT_PASSAGES = join(ROOT, "data", "passages")
const OUT_VOCAB = join(ROOT, "data", "vocab")
for (const d of [OUT_PASSAGES, OUT_VOCAB]) if (!existsSync(d)) mkdirSync(d, { recursive: true })

// grade_hint('초3-4','중1','고2') → grade_band
function gradeBand(hint) {
  const h = String(hint || "")
  if (/초|elementary|Elementary/.test(h)) return "elementary"
  if (/중|middle|Middle/.test(h)) return "middle"
  if (/고|high|High/.test(h)) return "high"
  return "unknown"
}

// ── 1. 지문: reading_text 테이블만 (libsql 로 SQLite 파일 읽기) ──
async function exportPassagesAsync() {
  const { createClient } = require("@libsql/client")
  if (!existsSync(SRC.passagesDb)) {
    console.error(`[export] 지문 DB 없음: ${SRC.passagesDb} (SRC_READING_DB 로 지정)`)
    return 0
  }
  const db = createClient({ url: `file:${SRC.passagesDb.replace(/\\/g, "/")}` })

  // ★ 화이트리스트: reading_text 테이블만, 컬럼 명시. csat_questions 는 언급조차 안 함.
  const res = await db.execute(`
    SELECT text_id, lexile_score, lexile_band, age_group, grade_hint, genre, topic,
           word_count, sentence_count, vocabulary_band, intended_use, text_body
    FROM reading_text
    ORDER BY lexile_score, text_id
  `)

  const lines = res.rows.map((r) => {
    const o = {
      text_id: r.text_id,
      lexile_score: r.lexile_score,
      lexile_band: r.lexile_band,
      age_group: r.age_group,
      grade_hint: r.grade_hint,
      grade_band: gradeBand(r.grade_hint),
      genre: r.genre,
      topic: r.topic,
      word_count: r.word_count,
      sentence_count: r.sentence_count,
      vocabulary_band: r.vocabulary_band,
      intended_use: r.intended_use,
      text_body: r.text_body,
      source: "lexile_textdb_original",
      license: "original",
    }
    return JSON.stringify(o)
  })

  // 안전 assert: 어떤 행에도 csat 필드가 섞이지 않았는지(방어)
  const joined = lines.join("\n")
  if (/csat_question|exam_year|기출/i.test(joined)) {
    throw new Error("[export] 지문 스냅샷에 기출 흔적 감지 — 중단")
  }

  writeFileSync(join(OUT_PASSAGES, "passages.jsonl"), joined + "\n", "utf8")
  console.log(`[export] passages.jsonl: ${lines.length}개 (reading_text 화이트리스트)`)
  return lines.length
}

// ── 2. 어휘 마스터: 필요한 필드만 트림 ─────────────────────
function exportVocab() {
  if (!existsSync(SRC.vocabJson)) {
    console.error(`[export] vocab 없음: ${SRC.vocabJson}`)
    return 0
  }
  const arr = JSON.parse(readFileSync(SRC.vocabJson, "utf8"))
  const lines = arr.map((r) => {
    const f = r.frameworks || {}
    const inCurr =
      f.kr_curriculum && String(f.kr_curriculum).trim() && f.kr_curriculum !== "비교육과정"
        ? 1
        : 0
    return JSON.stringify({
      word_id: String(r.word_id),
      word: r.word_display,
      pos: r.pos,
      meaning_ko: r.meaning_ko,
      cefr: f.cefr ?? null,
      kr_curriculum: f.kr_curriculum ?? null,
      grade_range_norm: f.grade_range_norm ?? null,
      lexile_band: f.lexile ?? null,
      us_grade: f.us_grade ?? null,
      in_curriculum: inCurr,
      irt: r.irt ?? null,
      source: r.source ?? "vocab-graph-db@efl-data-hub",
    })
  })
  writeFileSync(join(OUT_VOCAB, "vocab_min.jsonl"), lines.join("\n") + "\n", "utf8")
  console.log(`[export] vocab_min.jsonl: ${lines.length}개`)
  return lines.length
}

// ── 3. 설계맥락 카드 ───────────────────────────────────────
function exportCards() {
  if (!existsSync(SRC.cardsJsonl)) {
    console.error(`[export] cards 없음: ${SRC.cardsJsonl}`)
    return 0
  }
  const raw = readFileSync(SRC.cardsJsonl, "utf8").split(/\r?\n/).filter(Boolean)
  const seen = new Set()
  const lines = []
  for (const line of raw) {
    let c
    try {
      c = JSON.parse(line)
    } catch {
      continue
    }
    const hw = String(c.headword || "").trim()
    if (!hw || seen.has(hw.toLowerCase())) continue // PK 는 headword — 중복 제거
    seen.add(hw.toLowerCase())
    // tags 는 문자열화된 dict일 수 있음 → level 만 관용 추출
    let level = null
    const tags = c.tags
    if (typeof tags === "string") {
      const m = tags.match(/'level'\s*:\s*'([^']+)'/)
      if (m) level = m[1]
    } else if (tags && typeof tags === "object") {
      level = tags.level ?? null
    }
    // 앱이 실제로 쓰는 필드만 저장한다(원본 전체 card blob 은 vendoring 무게만
    // 키우고 어떤 쿼리도 참조하지 않으므로 제외).
    lines.push(
      JSON.stringify({
        headword: hw,
        gloss_ko: c.gloss_ko ?? null,
        colloc_en: c.colloc_en ?? null,
        colloc_kr: c.colloc_kr ?? null,
        ex_en: c.ex_en ?? null,
        ex_kr: c.ex_kr ?? null,
        level,
      }),
    )
  }
  writeFileSync(join(OUT_VOCAB, "cards_min.jsonl"), lines.join("\n") + "\n", "utf8")
  console.log(`[export] cards_min.jsonl: ${lines.length}개 (headword 중복제거)`)
  return lines.length
}

const p = await exportPassagesAsync()
const v = exportVocab()
const c = exportCards()
console.log(`[export] 완료 — 지문 ${p}, 어휘 ${v}, 카드 ${c}`)

"use server"

import { turso } from "@/lib/turso"
import { ulid } from "@/lib/kes-ids"
import { callGemini, parseGeminiJson } from "@/lib/gemini"
import { deriveLexileWindow, pointToLexile } from "@/lib/lexile-window"

// ============================================================
// 콘텐츠 조회 + 생성 — 워크시트·단어장 스튜디오의 서버 계층
//
// 원칙:
//  - 단어장은 쿼리 우선(kes_vocab_master + kes_vocab_cards). AI 는 카드가 없는
//    단어만 채운다(비용 0 우선).
//  - 워크시트 지문은 kes_passages(창작 지문)만 쓴다. 기출은 애초에 이 테이블에
//    없다. 산출물의 source_provenance 에 license 를 기록하고, 저장 전 assert.
// ============================================================

const ALLOWED_LICENSE = new Set(["original", "kogl", "generated"])

// ── 단어장 조회 ────────────────────────────────────────────
export interface WordlistFilter {
  cefr?: string[] // ['A2','B1']
  gradeBand?: string // elementary|middle|high (kr_curriculum 매핑용)
  curriculumOnly?: boolean // 교육과정 어휘만
  search?: string
  limit?: number
}

export interface WordlistItem {
  wordId: string
  word: string
  pos: string
  meaningKo: string
  cefr: string | null
  krCurriculum: string | null
  gradeRange: string | null
  lexileBand: string | null
  inCurriculum: boolean
  // 설계맥락 카드(있으면)
  collocEn: string | null
  exEn: string | null
  exKr: string | null
}

export async function queryWordlist(filter: WordlistFilter): Promise<WordlistItem[]> {
  try {
    const where: string[] = []
    const args: unknown[] = []

    if (filter.cefr && filter.cefr.length > 0) {
      where.push(`m.cefr IN (${filter.cefr.map(() => "?").join(",")})`)
      args.push(...filter.cefr)
    }
    if (filter.curriculumOnly) where.push("m.in_curriculum = 1")
    if (filter.search && filter.search.trim()) {
      where.push("(m.word LIKE ? OR m.meaning_ko LIKE ?)")
      const q = `%${filter.search.trim()}%`
      args.push(q, q)
    }

    const limit = Math.min(filter.limit ?? 200, 500)
    const sql = `
      SELECT m.word_id, m.word, m.pos, m.meaning_ko, m.cefr, m.kr_curriculum,
             m.grade_range_norm, m.lexile_band, m.in_curriculum,
             c.colloc_en, c.ex_en, c.ex_kr
      FROM kes_vocab_master m
      LEFT JOIN kes_vocab_cards c ON lower(c.headword) = lower(m.word)
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY m.cefr, m.word
      LIMIT ${limit}`

    const r = await turso.execute({ sql, args: args as never[] })
    return r.rows.map((row) => ({
      wordId: String(row.word_id),
      word: String(row.word ?? ""),
      pos: String(row.pos ?? ""),
      meaningKo: String(row.meaning_ko ?? ""),
      cefr: row.cefr ? String(row.cefr) : null,
      krCurriculum: row.kr_curriculum ? String(row.kr_curriculum) : null,
      gradeRange: row.grade_range_norm ? String(row.grade_range_norm) : null,
      lexileBand: row.lexile_band ? String(row.lexile_band) : null,
      inCurriculum: Number(row.in_curriculum ?? 0) === 1,
      collocEn: row.colloc_en ? String(row.colloc_en) : null,
      exEn: row.ex_en ? String(row.ex_en) : null,
      exKr: row.ex_kr ? String(row.ex_kr) : null,
    }))
  } catch (error) {
    console.error("Error in queryWordlist:", error)
    return []
  }
}

// ── 지문 조회 ──────────────────────────────────────────────
export interface PassageFilter {
  lexileMin?: number
  lexileMax?: number
  gradeBand?: string
  genre?: string
  search?: string
  limit?: number
}

export interface PassageRow {
  textId: string
  lexileScore: number | null
  lexileBand: string | null
  gradeBand: string | null
  gradeHint: string | null
  genre: string | null
  topic: string | null
  wordCount: number | null
  intendedUse: string | null
  textBody: string
  license: string
}

function toPassage(row: Record<string, unknown>): PassageRow {
  return {
    textId: String(row.text_id),
    lexileScore: row.lexile_score == null ? null : Number(row.lexile_score),
    lexileBand: row.lexile_band ? String(row.lexile_band) : null,
    gradeBand: row.grade_band ? String(row.grade_band) : null,
    gradeHint: row.grade_hint ? String(row.grade_hint) : null,
    genre: row.genre ? String(row.genre) : null,
    topic: row.topic ? String(row.topic) : null,
    wordCount: row.word_count == null ? null : Number(row.word_count),
    intendedUse: row.intended_use ? String(row.intended_use) : null,
    textBody: String(row.text_body ?? ""),
    license: String(row.license ?? "original"),
  }
}

export async function listPassages(filter: PassageFilter): Promise<PassageRow[]> {
  try {
    const where: string[] = []
    const args: unknown[] = []
    if (filter.lexileMin != null) {
      where.push("lexile_score >= ?")
      args.push(filter.lexileMin)
    }
    if (filter.lexileMax != null) {
      where.push("lexile_score <= ?")
      args.push(filter.lexileMax)
    }
    if (filter.gradeBand) {
      where.push("grade_band = ?")
      args.push(filter.gradeBand)
    }
    if (filter.genre) {
      where.push("genre = ?")
      args.push(filter.genre)
    }
    if (filter.search && filter.search.trim()) {
      where.push("(topic LIKE ? OR text_body LIKE ?)")
      const q = `%${filter.search.trim()}%`
      args.push(q, q)
    }
    // 거부된 지문은 워크시트 피커에서 제외(검토 거버넌스)
    where.push("review_status != 'rejected'")

    const limit = Math.min(filter.limit ?? 40, 100)
    const r = await turso.execute({
      sql: `SELECT text_id, lexile_score, lexile_band, grade_band, grade_hint, genre, topic,
                   word_count, intended_use, text_body, license
            FROM kes_passages
            ${where.length ? "WHERE " + where.join(" AND ") : ""}
            ORDER BY lexile_score
            LIMIT ${limit}`,
      args: args as never[],
    })
    return r.rows.map((row) => toPassage(row as unknown as Record<string, unknown>))
  } catch (error) {
    console.error("Error in listPassages:", error)
    return []
  }
}

export async function getPassage(textId: string): Promise<PassageRow | null> {
  try {
    const r = await turso.execute({
      sql: `SELECT text_id, lexile_score, lexile_band, grade_band, grade_hint, genre, topic,
                   word_count, intended_use, text_body, license
            FROM kes_passages WHERE text_id = ?`,
      args: [textId],
    })
    if (r.rows.length === 0) return null
    return toPassage(r.rows[0] as unknown as Record<string, unknown>)
  } catch (error) {
    console.error("Error in getPassage:", error)
    return null
  }
}

// ── 반 진단 → Lexile 창 ───────────────────────────────────
export async function deriveClassLexileWindow(
  classId: string,
): Promise<{ min: number; max: number; center: number; n: number } | null> {
  try {
    // 학생별 최신 스냅샷(lexile 우선, 없으면 vocab_cat theta)
    const r = await turso.execute({
      sql: `SELECT student_id, scale, value_num, value_text FROM (
              SELECT s.student_id, s.scale, s.value_num, s.value_text,
                     ROW_NUMBER() OVER (
                       PARTITION BY s.student_id
                       ORDER BY (CASE s.kind WHEN 'lexile' THEN 0 ELSE 1 END), s.taken_at DESC
                     ) rn
              FROM kes_diagnosis_snapshots s
              JOIN kes_enrollments e ON e.student_id = s.student_id
              WHERE e.class_id = ? AND e.active = 1 AND s.kind IN ('lexile','vocab_cat')
            ) WHERE rn = 1`,
      args: [classId],
    })
    const lexiles = r.rows
      .map((row) =>
        pointToLexile({
          scale: String(row.scale) as "lexile" | "theta_2pl" | "cefr",
          valueNum: row.value_num == null ? null : Number(row.value_num),
          valueText: row.value_text ? String(row.value_text) : null,
        }),
      )
      .filter((v): v is number => v != null)
    return deriveLexileWindow(lexiles)
  } catch (error) {
    console.error("Error in deriveClassLexileWindow:", error)
    return null
  }
}

// ── 지문 기반 워크시트 생성(AI) ────────────────────────────
export interface WorksheetItem {
  question: string
  options?: string[]
  answer?: number | string
  type: "mcq" | "short"
}

const TEACHER_SYSTEM = `당신은 대한민국 영어교사를 지원하는 AI 어시스턴트입니다.
2022 개정 교육과정, CEFR, Lexile 프레임워크 전문가입니다. 응답은 한국어 지시문 + 영어 문항으로 작성합니다.`

/**
 * 창작 지문(kes_passages) + 선택 성취기준으로 독해 문항을 생성한다.
 * 지문 자체는 저작권 청정이고, 문항은 AI 생성(license='generated')이다.
 */
export async function generatePassageWorksheet(params: {
  textId: string
  standardIds?: string[]
  numItems?: number
}): Promise<{ ok: boolean; items?: WorksheetItem[]; error?: string }> {
  try {
    const passage = await getPassage(params.textId)
    if (!passage) return { ok: false, error: "지문을 찾을 수 없습니다." }

    // 성취기준 grounding(있으면)
    let standardsText = ""
    if (params.standardIds && params.standardIds.length > 0) {
      const rows = await turso.execute({
        sql: `SELECT standard_id, standard_text_ko FROM kcsdb_standards
              WHERE standard_id IN (${params.standardIds.map(() => "?").join(",")})`,
        args: params.standardIds as never[],
      })
      standardsText = rows.rows
        .map((r) => `- [${r.standard_id}] ${r.standard_text_ko}`)
        .join("\n")
    }

    const n = Math.min(params.numItems ?? 4, 8)
    const prompt = `다음 영어 지문으로 독해 이해 문항 ${n}개를 만들어주세요.

지문 (Lexile ${passage.lexileScore ?? "?"}L, ${passage.genre}):
"""
${passage.textBody}
"""
${standardsText ? `\n관련 2022 개정 성취기준:\n${standardsText}\n` : ""}
요구사항:
- 4지선다(mcq) 위주, 필요시 서술형(short) 포함
- 지문 내용에 근거한 문항만(외부 지식 요구 금지)
- 지시문은 한국어, 문항·선택지는 영어

JSON 배열로만 응답:
[
  {"type":"mcq","question":"...","options":["A","B","C","D"],"answer":0},
  {"type":"short","question":"...","answer":"모범답안"}
]
Return ONLY valid JSON.`

    const text = await callGemini(prompt, TEACHER_SYSTEM, { json: true })
    const items = parseGeminiJson<WorksheetItem[]>(text)
    if (!Array.isArray(items)) return { ok: false, error: "생성 형식 오류" }
    return { ok: true, items }
  } catch (error) {
    console.error("Error in generatePassageWorksheet:", error)
    return { ok: false, error: "문항 생성에 실패했습니다." }
  }
}

// ── 워크시트/단어장 저장 ───────────────────────────────────
export async function saveWorksheet(params: {
  classId?: string
  title: string
  kind: "worksheet" | "wordlist"
  gradeBand?: string
  targetLexileMin?: number
  targetLexileMax?: number
  spec: unknown
  standardIds?: string[]
  provenance: Array<{ source: string; license: string }>
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  // ★ 저작권 방화벽: 저장 전 모든 기여 소스의 license 를 assert.
  for (const p of params.provenance) {
    if (!ALLOWED_LICENSE.has(p.license)) {
      return {
        ok: false,
        error: `허용되지 않은 라이선스(${p.license})가 포함되어 저장을 중단했습니다.`,
      }
    }
  }
  try {
    const id = ulid()
    await turso.execute({
      sql: `INSERT INTO kes_worksheets
              (id, class_id, title, kind, grade_band, target_lexile_min, target_lexile_max,
               spec, standard_ids, source_provenance, status)
            VALUES (?,?,?,?,?,?,?,?,?,?, 'draft')`,
      args: [
        id,
        params.classId ?? null,
        params.title,
        params.kind,
        params.gradeBand ?? null,
        params.targetLexileMin ?? null,
        params.targetLexileMax ?? null,
        JSON.stringify(params.spec),
        params.standardIds ? JSON.stringify(params.standardIds) : null,
        JSON.stringify(params.provenance),
      ],
    })
    return { ok: true, id }
  } catch (error) {
    console.error("Error in saveWorksheet:", error)
    return { ok: false, error: "저장에 실패했습니다." }
  }
}

// ── AI 생성 콘텐츠 검토 (거버넌스) ─────────────────────────
export interface PendingPassage extends PassageRow {
  source: string
}

/** 검토 대기(pending) AI 생성 지문 목록. */
export async function listPendingPassages(): Promise<PendingPassage[]> {
  try {
    const r = await turso.execute(
      `SELECT text_id, lexile_score, lexile_band, grade_band, grade_hint, genre, topic,
              word_count, intended_use, text_body, license, source
       FROM kes_passages
       WHERE review_status = 'pending'
       ORDER BY lexile_score, text_id
       LIMIT 200`,
    )
    return r.rows.map((row) => ({
      ...toPassage(row as unknown as Record<string, unknown>),
      source: String(row.source ?? ""),
    }))
  } catch (error) {
    console.error("Error in listPendingPassages:", error)
    return []
  }
}

/** 지문 검토 결정. status: approved | rejected. */
export async function reviewPassage(params: {
  textId: string
  status: "approved" | "rejected"
}): Promise<{ ok: boolean; error?: string }> {
  if (params.status !== "approved" && params.status !== "rejected") {
    return { ok: false, error: "잘못된 상태" }
  }
  try {
    await turso.execute({
      sql: "UPDATE kes_passages SET review_status = ? WHERE text_id = ?",
      args: [params.status, params.textId],
    })
    return { ok: true }
  } catch (error) {
    console.error("Error in reviewPassage:", error)
    return { ok: false, error: "검토 처리에 실패했습니다." }
  }
}

export async function listWorksheets(
  classId?: string,
): Promise<Array<{ id: string; title: string; kind: string; createdAt: string }>> {
  try {
    const r = classId
      ? await turso.execute({
          sql: `SELECT id, title, kind, created_at FROM kes_worksheets
                WHERE class_id = ? ORDER BY created_at DESC LIMIT 100`,
          args: [classId],
        })
      : await turso.execute(
          `SELECT id, title, kind, created_at FROM kes_worksheets
           ORDER BY created_at DESC LIMIT 100`,
        )
    return r.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      kind: String(row.kind ?? ""),
      createdAt: String(row.created_at ?? ""),
    }))
  } catch (error) {
    console.error("Error in listWorksheets:", error)
    return []
  }
}

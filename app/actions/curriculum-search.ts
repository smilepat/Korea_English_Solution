"use server"
// 대한민국 영어 교육과정 성취기준 4모드 검색 (kcsdb_* 정본 위)
//  S1 구조화(코드·필터) / S2 전문(FTS5·LIKE) / S3 의미(Gemini 임베딩) / S4 자연어(NL2SQL)
import { turso } from "@/lib/turso"

export type SearchMode = "auto" | "structured" | "fulltext" | "semantic" | "nl2sql"

export interface StdResult {
  standard_id: string
  curriculum_version: string
  grade_band: string
  domain_name_ko: string
  cefr_alignment: string | null
  standard_text_ko: string
  score?: number
}
export interface SearchResponse {
  mode: SearchMode
  results: StdResult[]
  note?: string
  sql?: string
}

const CODE_RE = /^\s*\[.+\]\s*$/
const SELECT_COLS =
  "standard_id, curriculum_version, grade_band, domain_name_ko, cefr_alignment, standard_text_ko"

function rowsToStd(rows: any[]): StdResult[] {
  return rows.map((r) => ({
    standard_id: String(r.standard_id ?? ""),
    curriculum_version: String(r.curriculum_version ?? ""),
    grade_band: String(r.grade_band ?? ""),
    domain_name_ko: String(r.domain_name_ko ?? ""),
    cefr_alignment: r.cefr_alignment ?? null,
    standard_text_ko: String(r.standard_text_ko ?? ""),
    score: typeof r.distance === "number" ? r.distance : undefined,
  }))
}

export interface Filters {
  version?: "2015" | "2022"
  band?: "elementary" | "middle" | "high"
  domain?: string
  cefr?: string
}

// ── S1: 구조화(코드 조회 + 필터) ──
async function structured(query: string, f: Filters, limit: number): Promise<StdResult[]> {
  const where: string[] = []
  const args: any[] = []
  if (query && CODE_RE.test(query)) {
    where.push("REPLACE(standard_id,' ','') = ?")
    args.push(query.trim().replace(/\s/g, ""))
  } else if (query) {
    where.push("standard_text_ko LIKE '%' || ? || '%'")
    args.push(query)
  }
  if (f.version) { where.push("curriculum_version = ?"); args.push(f.version) }
  if (f.band) { where.push("grade_band = ?"); args.push(f.band) }
  if (f.domain) { where.push("(domain_name_ko = ? OR domain_code = ?)"); args.push(f.domain, f.domain) }
  if (f.cefr) { where.push("cefr_alignment = ?"); args.push(f.cefr) }
  const sql = `SELECT ${SELECT_COLS} FROM kcsdb_standards ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY curriculum_version, standard_id LIMIT ?`
  args.push(limit)
  const r = await turso.execute({ sql, args })
  return rowsToStd(r.rows as any[])
}

// ── S2: 전문검색(FTS5 우선, 실패 시 LIKE) ──
async function fulltext(query: string, f: Filters, limit: number): Promise<StdResult[]> {
  try {
    const r = await turso.execute({
      sql: `SELECT s.${SELECT_COLS.split(", ").map((c) => "s." + c.trim()).join(", ")}
            FROM kcsdb_standards_fts f JOIN kcsdb_standards s ON s.standard_id = f.standard_id
            WHERE kcsdb_standards_fts MATCH ?
            ${f.version ? "AND s.curriculum_version = :v" : ""}
            ${f.band ? "AND s.grade_band = :b" : ""}
            LIMIT ?`.replace(":v", "'" + (f.version || "") + "'").replace(":b", "'" + (f.band || "") + "'"),
      args: [`"${query.replace(/"/g, "")}"`, limit],
    })
    if (r.rows.length) return rowsToStd(r.rows as any[])
  } catch { /* trigram은 3자 미만 등에서 실패 → LIKE 폴백 */ }
  return structured(query, f, limit) // LIKE 폴백
}

// ── S3: 의미검색(Gemini 임베딩 + 코사인) ──
async function semantic(query: string, limit: number): Promise<StdResult[]> {
  const { embedQuery } = await import("@/lib/kcsdb-ai")
  const emb = await embedQuery(query)
  if (!emb.length) throw new Error("임베딩 실패")
  const vec = `[${emb.join(",")}]`
  const r = await turso.execute({
    sql: `SELECT s.standard_id, s.curriculum_version, s.grade_band, s.domain_name_ko,
                 s.cefr_alignment, s.standard_text_ko,
                 vector_distance_cos(v.embedding, vector32(?)) AS distance
          FROM kcsdb_vec v JOIN kcsdb_standards s ON s.standard_id = v.standard_id
          ORDER BY distance ASC LIMIT ?`,
    args: [vec, limit],
  })
  return rowsToStd(r.rows as any[])
}

// ── S4: 자연어 → SQL (Gemini 생성 + 안전검사) ──
const SCHEMA_HINT = `테이블 kcsdb_standards(standard_id, curriculum_version['2015'|'2022'], grade_band['elementary'|'middle'|'high'], grade_level, subject_name_ko, domain_code, domain_name_ko['듣기'|'말하기'|'읽기'|'쓰기'|'이해'|'표현'], standard_text_ko, cefr_alignment, verification_status)
테이블 kcsdb_levels(standard_id, scale_type['achievement_level'|'eval_criteria'], level['A'..'E'|'상'|'중'|'하'], descriptor_ko)
테이블 kcsdb_vocab(word, curriculum_version, level_marker, cefr, meaning_ko)`

function safeSelect(sql: string): string | null {
  let s = sql.trim().replace(/;+\s*$/, "").replace(/^```sql\s*/i, "").replace(/```$/,"").trim()
  if (!/^select\b/i.test(s)) return null
  if (/\b(insert|update|delete|drop|alter|attach|pragma|create|replace)\b/i.test(s)) return null
  if (/;/.test(s)) return null
  if (/\bfrom\b\s+(?!kcsdb_)/i.test(s) && !/kcsdb_/i.test(s)) return null
  if (!/kcsdb_/i.test(s)) return null
  if (!/\blimit\b/i.test(s)) s += " LIMIT 50"
  return s
}

async function nl2sql(query: string): Promise<{ results: StdResult[]; sql?: string; note?: string }> {
  const { geminiGenerate } = await import("@/lib/kcsdb-ai")
  const prompt = `다음 스키마의 SQLite DB에서 사용자 질문에 답하는 SELECT 문 하나만 출력해라(설명·코드펜스 없이 SQL만).
반드시 kcsdb_ 테이블만 사용하고, 결과에는 가능하면 standard_id, standard_text_ko를 포함하며 LIMIT을 붙여라.
${SCHEMA_HINT}
질문: ${query}`
  const raw = await geminiGenerate(prompt)
  const sql = safeSelect(raw)
  if (!sql) return { results: [], note: "안전한 SELECT를 생성하지 못했습니다. 다른 표현으로 시도해 주세요.", sql: raw.slice(0, 200) }
  try {
    const r = await turso.execute(sql)
    return { results: rowsToStd(r.rows as any[]), sql }
  } catch (e: any) {
    return { results: [], note: "쿼리 실행 오류: " + (e?.message ?? ""), sql }
  }
}

// ── 통합 파사드 ──
export async function curriculumSearch(
  query: string, mode: SearchMode = "auto", filters: Filters = {}, limit = 30
): Promise<SearchResponse> {
  const q = (query || "").trim()
  let m = mode
  if (m === "auto") {
    if (CODE_RE.test(q)) m = "structured"
    else if (/[?？]|알려|추천|무엇|어떤|연결|만들|찾아/.test(q)) m = "nl2sql"
    else m = "fulltext"
  }
  try {
    if (m === "structured") return { mode: m, results: await structured(q, filters, limit) }
    if (m === "fulltext") return { mode: m, results: await fulltext(q, filters, limit) }
    if (m === "semantic") return { mode: m, results: await semantic(q, limit) }
    if (m === "nl2sql") { const r = await nl2sql(q); return { mode: m, ...r } }
  } catch (e: any) {
    return { mode: m, results: [], note: "검색 오류: " + (e?.message ?? "") }
  }
  return { mode: m, results: [] }
}

// 성취기준별 성취수준 조회(상세 패널용)
export async function getLevels(standardId: string) {
  const r = await turso.execute({
    sql: `SELECT scale_type, level, descriptor_ko, cut_score FROM kcsdb_levels
          WHERE standard_id = ? ORDER BY scale_type, level`,
    args: [standardId],
  })
  return r.rows as any[]
}

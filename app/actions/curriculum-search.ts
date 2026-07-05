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
  const guard = await import("@/lib/kcsdb-guard")
  let emb = await guard.getCachedEmbedding(query)   // 캐시 우선(비용 절감)
  if (!emb || !emb.length) {
    const { embedQuery } = await import("@/lib/kcsdb-ai")
    emb = await embedQuery(query)
    if (emb.length) guard.setCachedEmbedding(query, emb).catch(() => {})
  }
  if (!emb || !emb.length) throw new Error("임베딩 실패")
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
테이블 kcsdb_vocab(word, curriculum_version, level_marker, cefr, meaning_ko)

작성 규칙(중요):
- 학교급은 반드시 grade_band로만 필터한다. "중1/중2/중3/중학교"→'middle', "고1/고2/고3/고등학교"→'high', "초등"→'elementary'.
- grade_level 은 학년군 문자열('3-4','5-6','1-3','1-3학년' 등)이라 '3' 같은 단일 학년으로 매칭하면 안 된다. 웬만하면 쓰지 말 것.
- 주제·기능·개념 키워드(추론/세부 정보/주제/요지/의도/심정/함축 등)는 반드시 standard_text_ko LIKE '%키워드%' 로 검색한다.
- 영역(domain_name_ko): 2015는 듣기·말하기·읽기·쓰기, 2022는 이해·표현. 애매하면 domain 조건을 생략한다.
- 항상 LIMIT 30 이하를 붙이고, standard_id 와 standard_text_ko 를 SELECT 한다.

예) "중3 읽기에서 추론 관련 성취기준" →
SELECT standard_id, standard_text_ko FROM kcsdb_standards WHERE grade_band='middle' AND domain_name_ko='읽기' AND standard_text_ko LIKE '%추론%' LIMIT 30
예) "고등학교 빈칸추론과 연결되는 함축 의미 성취기준" →
SELECT standard_id, standard_text_ko FROM kcsdb_standards WHERE grade_band='high' AND standard_text_ko LIKE '%함축%' LIMIT 30`

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

// Gemini는 SQL을 만들지 않고, 질문에서 "구조화 조건(JSON)"만 추출한다.
// → 우리가 안전한 파라미터 쿼리를 만들고, 0건이면 조건을 자동 완화한다(SQL 인젝션 원천 차단).
const EXTRACT_PROMPT = (q: string) => `사용자의 한국어 질문에서 영어 교육과정 성취기준 검색조건을 JSON으로만 출력해라(설명·코드펜스 없이 JSON만).
형식: {"band":"","version":"","domain":"","keywords":[]}
- band: 학교급. "초등"→"elementary", "중학교/중1/중2/중3"→"middle", "고등학교/고1/고2/고3"→"high". 없으면 "".
- version: "2015" 또는 "2022". 명시 없으면 "".
- domain: "듣기"|"말하기"|"읽기"|"쓰기"|"이해"|"표현" 중 명확할 때만. 없으면 "". (2022는 이해·표현만 있음)
- keywords: 주제·기능 핵심어 배열. 조사·군더더기 제거하고 데이터에 실제 나올 어간만. 예 "추론과정"→["추론"], "세부 정보 파악"→["세부 정보"], "필자의 의도"→["의도"].
질문: ${q}`

async function nl2sql(query: string): Promise<{ results: StdResult[]; sql?: string; note?: string }> {
  const { geminiGenerate } = await import("@/lib/kcsdb-ai")
  let f: any = {}
  try {
    const raw = await geminiGenerate(EXTRACT_PROMPT(query))
    f = JSON.parse((raw.match(/\{[\s\S]*\}/) || ["{}"])[0])
  } catch {
    return { results: [], note: "질문을 해석하지 못했습니다. 다른 표현으로 시도해 주세요." }
  }
  const kws: string[] = (Array.isArray(f.keywords) ? f.keywords : []).map((k: any) => String(k).trim()).filter(Boolean).slice(0, 4)

  const build = (useDomain: boolean, useBand: boolean) => {
    const where: string[] = [], args: any[] = []
    if (useBand && f.band) { where.push("grade_band = ?"); args.push(f.band) }
    if (f.version === "2015" || f.version === "2022") { where.push("curriculum_version = ?"); args.push(f.version) }
    if (useDomain && f.domain) { where.push("domain_name_ko = ?"); args.push(f.domain) }
    for (const kw of kws) { where.push("standard_text_ko LIKE '%' || ? || '%'"); args.push(kw) }
    return {
      sql: `SELECT ${SELECT_COLS} FROM kcsdb_standards ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY curriculum_version, standard_id LIMIT 30`,
      args,
    }
  }
  const cond = [f.band, f.version, f.domain, ...kws].filter(Boolean).join(" · ") || "없음"
  // 전체조건 → 0건이면 domain 완화 → 그래도 0이면 band까지 완화
  const relax: [boolean, boolean][] = [[true, true], [false, true], [false, false]]
  for (let i = 0; i < relax.length; i++) {
    const { sql, args } = build(relax[i][0], relax[i][1])
    const r = await turso.execute({ sql, args })
    if (r.rows.length) {
      return {
        results: rowsToStd(r.rows as any[]),
        note: i === 0 ? undefined : "일부 조건을 완화해 검색했습니다.",
        sql: `해석 조건: ${cond}`,
      }
    }
  }
  // 0건(예: 수능 용어 '빈칸추론' 등 교육과정 문구와 불일치) → 의미검색 폴백
  try {
    const sem = await semantic(query, 10)
    if (sem.length) return { results: sem, note: `조건 검색 0건 → 의미검색으로 대체 (해석: ${cond})` }
  } catch { /* 임베딩 실패 시 무시 */ }
  return { results: [], note: `해당 조건의 성취기준을 찾지 못했습니다. (해석: ${cond})` }
}

// ── 통합 파사드 ──
export async function curriculumSearch(
  query: string, mode: SearchMode = "auto", filters: Filters = {}, limit = 30
): Promise<SearchResponse> {
  const t0 = Date.now()
  const q = (query || "").trim()
  const requested = mode
  let m = mode
  if (m === "auto") {
    if (CODE_RE.test(q)) m = "structured"
    else if (/[?？]|알려|추천|무엇|어떤|연결|만들|찾아/.test(q)) m = "nl2sql"
    else m = "fulltext"
  }
  // AI 모드(S3/S4) 레이트리밋 → 초과 시 전문검색(S2)으로 우아하게 강등
  let degraded = false
  if (m === "semantic" || m === "nl2sql") {
    const guard = await import("@/lib/kcsdb-guard")
    const ip = await guard.getClientIp()
    if (!(await guard.checkAiRate(ip))) { m = "fulltext"; degraded = true }
  }
  let resp: SearchResponse
  try {
    if (m === "structured") resp = { mode: m, results: await structured(q, filters, limit) }
    else if (m === "fulltext") resp = { mode: m, results: await fulltext(q, filters, limit) }
    else if (m === "semantic") resp = { mode: m, results: await semantic(q, limit) }
    else if (m === "nl2sql") { const r = await nl2sql(q); resp = { mode: m, ...r } }
    else resp = { mode: m, results: [] }
    if (degraded) resp.note = (resp.note ? resp.note + " " : "") + "(사용량 보호로 전문검색으로 전환됨)"
  } catch (e: any) {
    resp = { mode: m, results: [], note: "검색 오류: " + (e?.message ?? "") }
  }
  // 비동기 로깅(응답 지연 없음)
  import("@/lib/kcsdb-guard").then((g) => g.logSearch(requested + "→" + resp.mode, q, resp.results.length, resp.note || "", Date.now() - t0)).catch(() => {})
  return resp
}

// 성취기준 상세(상세 패널용): 성취수준 A~E/상·중·하 + 같은 CEFR 연계 어휘
export interface StandardDetail {
  levels: { scale_type: string; level: string; descriptor_ko: string; cut_score?: string }[]
  cefr: string | null
  cefrSource: string | null   // original | inherited | estimated
  vocab: { word: string; meaning_ko: string | null }[]
  csatTypes: { csat_type: string; confidence: string }[]   // 수능 유형(참고·공인 아님)
}
export async function getStandardDetail(standardId: string): Promise<StandardDetail> {
  const [lv, meta, ct] = await Promise.all([
    turso.execute({
      sql: `SELECT scale_type, level, descriptor_ko, cut_score FROM kcsdb_levels
            WHERE standard_id = ? ORDER BY scale_type DESC, level`,
      args: [standardId],
    }),
    turso.execute({
      sql: `SELECT cefr_alignment, curriculum_version, cefr_source FROM kcsdb_standards WHERE standard_id = ?`,
      args: [standardId],
    }),
    turso.execute({
      sql: `SELECT csat_type, confidence FROM kcsdb_csat_type_map WHERE standard_id = ?`,
      args: [standardId],
    }).catch(() => ({ rows: [] as any[] })),
  ])
  const cefr = (meta.rows[0]?.cefr_alignment as string) || null
  const cefrSource = (meta.rows[0]?.cefr_source as string) || null
  const version = (meta.rows[0]?.curriculum_version as string) || null
  let vocab: any[] = []
  if (cefr) {
    const v = await turso.execute({
      sql: `SELECT word, meaning_ko FROM kcsdb_vocab
            WHERE cefr = ? ${version ? "AND curriculum_version = ?" : ""} AND meaning_ko IS NOT NULL AND meaning_ko != ''
            ORDER BY CAST(NULLIF(freq_rank,'') AS INTEGER) LIMIT 12`,
      args: version ? [cefr, version] : [cefr],
    })
    vocab = v.rows
  }
  return { levels: lv.rows as any[], cefr, cefrSource, vocab: vocab as any[], csatTypes: (ct.rows as any[]) }
}

// 하위호환
export async function getLevels(standardId: string) {
  return (await getStandardDetail(standardId)).levels
}

// 관련 의사소통 기능(영어 예시문) + 언어 형식(문법) — 검색어 키워드 매칭. 교사가 바로 쓸 참고자료.
export interface RefFunction { category: string; description: string; version: string; examples: string[] }
export interface RefGrammar { item: string; category: string | null; example: string }
export interface ReferenceResult { functions: RefFunction[]; grammar: RefGrammar[] }
export async function searchReference(query: string, version?: string): Promise<ReferenceResult> {
  const q = (query || "").trim()
  if (!q || CODE_RE.test(q)) return { functions: [], grammar: [] }
  const [fns, gr] = await Promise.all([
    turso.execute({
      sql: `SELECT DISTINCT id, category_l1, description_ko, curriculum_version FROM kcsdb_comm_functions
            WHERE (description_ko LIKE '%' || ? || '%' OR category_l1 LIKE '%' || ? || '%')
            ${version === "2015" || version === "2022" ? "AND curriculum_version = ?" : ""} LIMIT 6`,
      args: version === "2015" || version === "2022" ? [q, q, version] : [q, q],
    }),
    turso.execute({
      sql: `SELECT item_name_ko, category, example_en FROM kcsdb_grammar
            WHERE item_name_ko LIKE '%' || ? || '%' OR category LIKE '%' || ? || '%' LIMIT 6`,
      args: [q, q],
    }).catch(() => ({ rows: [] as any[] })),
  ])
  const functions: RefFunction[] = []
  for (const f of fns.rows as any[]) {
    const ex = await turso.execute({ sql: `SELECT example_en FROM kcsdb_comm_function_examples WHERE function_id = ? LIMIT 5`, args: [f.id] })
    const examples = (ex.rows as any[]).map((r) => String(r.example_en || "")).filter((e) => /[A-Za-z]/.test(e) && e.length < 90).slice(0, 3)
    if (examples.length) functions.push({ category: f.category_l1, description: f.description_ko, version: f.curriculum_version, examples })
  }
  const grammar: RefGrammar[] = (gr.rows as any[]).map((r) => ({ item: String(r.item_name_ko || ""), category: r.category || null, example: String(r.example_en || "") })).filter((g) => g.item)
  return { functions, grammar }
}

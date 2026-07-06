"use server"
// 성취기준 기반 AI 문항 생성(선택형 4/5지선다 · 서술형 단답/논술·영작).
// 모델: Gemini 2.5-flash (이 앱의 Anthropic 키는 무효라 lib/ai.ts generateCsatItem 재사용 불가).
// 산출물은 source='ai' — 고시 정본 아님, 교사 검수 필요.
import { turso } from "@/lib/turso"
import { geminiGenerate } from "@/lib/kcsdb-ai"
import { getStandardDetail } from "@/app/actions/curriculum-search"

export type ItemType = "mcq4" | "mcq5" | "short" | "essay"
export type Difficulty = "easy" | "medium" | "hard"

export interface GeneratedItem {
  id: number
  standardId: string
  itemType: ItemType
  difficulty: Difficulty
  payload: any            // 유형별 구조(아래 프롬프트 스키마와 일치)
  model: string
  source: string          // 'ai'
  createdAt: string
}

const MODEL = "gemini-2.5-flash"
const DIFF_LABEL: Record<Difficulty, string> = { easy: "쉬움", medium: "중간", hard: "어려움" }

function isMcq(t: ItemType) { return t === "mcq4" || t === "mcq5" }

// ── 유형별 프롬프트(엄격 JSON only). 성취기준을 grounding으로 사용. ──
function buildPrompt(t: ItemType, std: any, levels: string[], difficulty: Difficulty): string {
  const band = ({ elementary: "초등학교", middle: "중학교", high: "고등학교" } as any)[std.grade_band] || std.grade_band
  const ground = `대한민국 영어 교육과정 성취기준을 평가하는 문항을 만들어라.
[성취기준 코드] ${std.standard_id}
[성취기준] ${std.standard_text_ko}
[학교급] ${band} · [영역] ${std.domain_name_ko || "미상"} · [교육과정] ${std.curriculum_version} 개정
[목표 수준] CEFR ${std.cefr_alignment || "미상"} · 난이도 ${DIFF_LABEL[difficulty]}
${levels.length ? "[성취수준 기술]\n" + levels.slice(0, 4).map((d) => "- " + d).join("\n") : ""}

공통 규칙:
- 이 성취기준이 요구하는 능력을 실제로 측정하도록 설계한다.
- 학교급·CEFR 수준에 맞는 어휘·문장 난이도를 지킨다. 지문/발문은 자연스러운 영어, 해설·안내는 한국어.
- 반드시 아래 JSON 형식으로만 응답한다(코드펜스·설명 없이 JSON만).`

  if (isMcq(t)) {
    const n = t === "mcq5" ? 5 : 4
    const csat = t === "mcq5" ? "\n- 수능 영어 유형(빈칸추론·요지·주제 등)을 참고해 5~8문장 지문과 매력적 오답을 구성한다." : ""
    return `${ground}
- 선택형 ${n}지선다. 영어 지문(읽기·이해 영역이면 3~8문장) → 발문 → 선택지 ${n}개 → 정답(1~${n}) → 해설.${csat}
{"passage":"영어 지문","question":"발문(한국어)","options":["① …","② …",${n === 5 ? '"③ …","④ …","⑤ …"' : '"③ …","④ …"'}],"answer":정답번호(1~${n}),"explanation":"정답 근거와 오답 이유(한국어)"}`
  }
  if (t === "short") {
    return `${ground}
- 서술형 단답형. 학생이 단어·구·한 문장으로 답하도록 발문을 만든다. 필요하면 짧은 자료(지문/대화)를 제시한다.
{"prompt":"제시 자료(영어, 없으면 빈 문자열)","question":"발문(한국어)","model_answer":"모범답안(영어)","scoring_points":["채점 포인트1(한국어)","채점 포인트2"],"explanation":"출제 의도와 유의점(한국어)"}`
  }
  // essay
  return `${ground}
- 서술형 논술·영작. 학생이 여러 문장으로 자신의 생각을 쓰도록 과제를 만든다(쓰기·표현 영역 권장).
{"task":"작문 과제 지시문(한국어, 영어 조건 병기 가능)","guidance":"작성 안내·분량·필수 포함 요소(한국어)","rubric":[{"criterion":"평가 기준명","descriptor":"상 수준 기술(한국어)"}],"sample_answer":"예시 답안(영어)"}`
}

function parseJson(raw: string): any | null {
  try {
    const m = raw.replace(/```json|```/g, "").match(/\{[\s\S]*\}/)
    return m ? JSON.parse(m[0]) : null
  } catch { return null }
}

// 유형별 payload 최소 유효성(선지 수·필수 필드) 검사.
function validate(t: ItemType, p: any): boolean {
  if (!p || typeof p !== "object") return false
  if (isMcq(t)) {
    const n = t === "mcq5" ? 5 : 4
    return Array.isArray(p.options) && p.options.length === n && Number.isInteger(p.answer) && p.answer >= 1 && p.answer <= n && !!p.question
  }
  if (t === "short") return !!p.question && !!p.model_answer && Array.isArray(p.scoring_points)
  return !!p.task && Array.isArray(p.rubric) && p.rubric.length > 0   // essay
}

export async function generateCurriculumItem(params: {
  standardId: string; itemType: ItemType; difficulty?: Difficulty
}): Promise<{ ok: boolean; item?: GeneratedItem; error?: string }> {
  const { standardId, itemType } = params
  const difficulty: Difficulty = params.difficulty || "medium"
  if (!standardId || !itemType) return { ok: false, error: "성취기준과 문항 유형이 필요합니다." }

  // 비용 방어: AI 생성은 무거우므로 검색보다 낮은 별도 한도(IP·60초).
  try {
    const guard = await import("@/lib/kcsdb-guard")
    const ip = await guard.getClientIp()
    if (!(await guard.checkGenRate(ip))) return { ok: false, error: "생성 요청이 많습니다. 잠시 후 다시 시도해 주세요." }
  } catch { /* 가드 실패가 기능을 막지 않도록 */ }

  // 성취기준 + 성취수준 기술 확보(grounding)
  const row = await turso.execute({
    sql: `SELECT standard_id, curriculum_version, grade_band, domain_name_ko, cefr_alignment, standard_text_ko
          FROM kcsdb_standards WHERE standard_id = ?`,
    args: [standardId],
  })
  const std = row.rows[0] as any
  if (!std) return { ok: false, error: "성취기준을 찾지 못했습니다." }
  let levels: string[] = []
  try {
    const detail = await getStandardDetail(standardId)
    levels = (detail.levels || []).map((l) => l.descriptor_ko).filter(Boolean)
  } catch { /* 성취수준 없어도 생성 진행 */ }

  // Gemini 생성 + 파싱 + 검증(1회 재시도)
  let payload: any = null
  for (let attempt = 0; attempt < 2 && !validate(itemType, payload); attempt++) {
    try {
      const raw = await geminiGenerate(buildPrompt(itemType, std, levels, difficulty), { maxOutputTokens: 2048, temperature: attempt ? 0.4 : 0.2, thinkingBudget: 0 })
      payload = parseJson(raw)
    } catch (e: any) {
      return { ok: false, error: "AI 생성 오류: " + (e?.message ?? "") }
    }
  }
  if (!validate(itemType, payload)) return { ok: false, error: "문항 형식이 올바르지 않습니다. 다시 시도해 주세요." }

  // 저장
  const ins = await turso.execute({
    sql: `INSERT INTO kcsdb_generated_items (standard_id, curriculum_version, grade_band, domain_name_ko, cefr, item_type, difficulty, payload, model, source)
          VALUES (?,?,?,?,?,?,?,?,?, 'ai')`,
    args: [std.standard_id, std.curriculum_version, std.grade_band, std.domain_name_ko, std.cefr_alignment, itemType, difficulty, JSON.stringify(payload), MODEL],
  })
  return {
    ok: true,
    item: {
      id: Number(ins.lastInsertRowid), standardId, itemType, difficulty, payload,
      model: MODEL, source: "ai", createdAt: new Date().toISOString(),
    },
  }
}

export async function getCurriculumItems(standardId: string): Promise<GeneratedItem[]> {
  if (!standardId) return []
  try {
    const r = await turso.execute({
      sql: `SELECT id, standard_id, item_type, difficulty, payload, model, source, created_at
            FROM kcsdb_generated_items WHERE standard_id = ? ORDER BY created_at DESC, id DESC LIMIT 20`,
      args: [standardId],
    })
    return (r.rows as any[]).map((x) => ({
      id: Number(x.id), standardId: String(x.standard_id), itemType: x.item_type as ItemType,
      difficulty: (x.difficulty || "medium") as Difficulty, payload: safeParse(x.payload),
      model: x.model || MODEL, source: x.source || "ai", createdAt: String(x.created_at || ""),
    }))
  } catch { return [] }
}

export async function deleteCurriculumItem(id: number): Promise<{ ok: boolean }> {
  try { await turso.execute({ sql: "DELETE FROM kcsdb_generated_items WHERE id = ?", args: [id] }); return { ok: true } }
  catch { return { ok: false } }
}

function safeParse(s: any) { try { return JSON.parse(String(s)) } catch { return {} } }

// lib/recipes/fill.ts — 레시피의 빈칸(slot)을 지문으로 채운다. 파이프라인 ④.
//
// AI 가 하는 일은 딱 하나 — 빈칸 채우기. 레시피 자체는 만들지 않는다.
//   from: "passage"   → 지문에서 그대로 옮긴다. 채운 뒤 지문에 실재하는지 결정론으로 확인하고,
//                       없는 것은 버린다(지어낸 근거를 조용히 통과시키지 않는다).
//   from: "generated" → AI 가 쓴다(물음·모범답·빈칸 틀).
// 렌더링(템플릿 치환)과 검증은 AI 없는 순수 함수라 테스트한다.
import { callGemini } from "@/lib/gemini"
import type { Recipe, Slot } from "./types"

export type SlotValue = string | string[]
export type SlotValues = Record<string, SlotValue>

export interface FilledRecipe {
  recipe: Recipe
  values: SlotValues
  /** 지문에 없어서 버린 항목 (slot key → 버린 문자열들) */
  dropped: Record<string, string[]>
  /** 필수 slot 이 다 찼는가. 아니면 교사가 직접 채워야 한다 */
  complete: boolean
  studentText: string
  teacherNote: string
}

const norm = (s: string) => s.replace(/\s+/g, " ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim().toLowerCase()

/** 문장 급은 앞 60자, 어구·낱말 급은 통째로 — 지문에 실재하는가 */
export function groundedIn(item: string, text: string, kind: Slot["kind"]): boolean {
  const hay = norm(text)
  const needle = norm(item)
  if (!needle) return false
  if (kind === "word_list" || kind === "phrase_list") return needle.length >= 2 && hay.includes(needle)
  return needle.length >= 12 && hay.includes(needle.slice(0, 60))
}

/** from:passage slot 의 값에서 지문에 없는 항목을 걷어낸다. */
export function groundValues(recipe: Recipe, values: SlotValues, text: string): { values: SlotValues; dropped: Record<string, string[]> } {
  const out: SlotValues = {}
  const dropped: Record<string, string[]> = {}
  for (const s of recipe.slots) {
    const v = values[s.key]
    if (v == null) continue
    if (s.from === "generated") { out[s.key] = v; continue }
    if (Array.isArray(v)) {
      const keep = v.filter((x) => groundedIn(x, text, s.kind))
      const gone = v.filter((x) => !groundedIn(x, text, s.kind))
      if (gone.length) dropped[s.key] = gone
      if (keep.length) out[s.key] = keep
    } else if (groundedIn(v, text, s.kind)) {
      out[s.key] = v
    } else {
      dropped[s.key] = [v]
    }
  }
  return { values: out, dropped }
}

/** 채워진 값이 slot 계약을 만족하는가 (리스트는 n 의 절반 이상). */
export function isComplete(recipe: Recipe, values: SlotValues): boolean {
  return recipe.slots.every((s) => {
    const v = values[s.key]
    if (v == null) return false
    if (Array.isArray(v)) return v.length >= Math.max(1, Math.ceil((s.n ?? 1) / 2))
    return typeof v === "string" && v.trim().length > 0
  })
}

/**
 * {{key}} → 값, {{key.n}} → 개수. 없는 값은 빈칸 표시.
 * 리스트는 자리 따라 다르게 — 줄 머리에 있으면 줄마다 "- ", 문장 안에 있으면 ", " 로 잇는다.
 * ("- Donna Williams에게 답장을" 처럼 찍히지 않게.)
 */
export function renderTemplate(tpl: string, values: SlotValues): string {
  return tpl.replace(/\{\{([a-zA-Z0-9_]+)(?:\.(n))?\}\}/g, (_m, key: string, dotN: string | undefined, offset: number) => {
    const v = values[key]
    if (v == null) return dotN ? "?" : "［교사가 채울 것］"
    if (dotN) return String(Array.isArray(v) ? v.length : 1)
    if (!Array.isArray(v)) return v
    const atLineStart = offset === 0 || tpl[offset - 1] === "\n"
    if (!atLineStart || v.length === 1) return v.join(", ")
    return v.map((x) => `- ${x}`).join("\n")
  })
}

export function renderRecipe(recipe: Recipe, values: SlotValues): Pick<FilledRecipe, "studentText" | "teacherNote"> {
  return { studentText: renderTemplate(recipe.studentText, values), teacherNote: renderTemplate(recipe.teacherNote, values) }
}

// ── AI ──────────────────────────────────────────────────────

function slotSpec(s: Slot): string {
  const shape = s.kind.endsWith("_list") || s.kind === "question_list" ? `문자열 배열 (${s.n ?? 1}개)` : "문자열"
  const src = s.from === "passage" ? "지문에서 **한 글자도 바꾸지 말고 그대로** 옮긴다" : "네가 쓴다"
  return `  - "${s.key}": ${shape}. ${src}. 규칙: ${s.rule}`
}

function fillPrompt(recipe: Recipe, text: string, grade: string): string {
  return `너는 한국 ${grade} 영어 교사의 수업 활동지에 들어갈 빈칸을 채운다.
활동은 이미 정해져 있다. 너는 아래 빈칸만 채운다. 활동을 바꾸거나 더하지 마라.

활동: ${recipe.titleKo}
학생에게 보일 글(빈칸 있음): ${recipe.studentText}

채울 빈칸:
${recipe.slots.map(slotSpec).join("\n")}

규칙
1. "지문에서 그대로 옮긴다"인 빈칸은 원문 문장·어구를 복사한다. 요약·바꿔쓰기·번역 금지. 지문에 없는 것을 넣지 마라.
2. "네가 쓴다"인 빈칸은 학생 수준(${grade})에 맞는 영어로 쓴다. 답이 지문에 있어야 하는 물음이면 정말 지문에 답이 있어야 한다.
3. 오직 JSON 만 출력한다: {"<key>": <값>, ...}

지문:
"""
${text}
"""`
}

export async function fillRecipe(recipe: Recipe, text: string, grade: string, model = "gemini-2.5-flash"): Promise<FilledRecipe> {
  let raw: SlotValues = {}
  if (recipe.slots.length) {
    try {
      const res = await callGemini(fillPrompt(recipe, text, grade), undefined, { model, json: true, temperature: 0.2, maxOutputTokens: 4096 })
      const m = res.match(/\{[\s\S]*\}/)
      const parsed = m ? (JSON.parse(m[0]) as Record<string, unknown>) : {}
      for (const s of recipe.slots) {
        const v = parsed[s.key]
        if (typeof v === "string") raw[s.key] = v
        else if (Array.isArray(v)) raw[s.key] = v.filter((x): x is string => typeof x === "string")
      }
    } catch (e) {
      console.error(`[fill] ${recipe.id}:`, e instanceof Error ? e.message : e)
      raw = {}
    }
  }
  const { values, dropped } = groundValues(recipe, raw, text)
  return { recipe, values, dropped, complete: isComplete(recipe, values), ...renderRecipe(recipe, values) }
}

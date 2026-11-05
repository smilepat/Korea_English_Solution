// lib/text-type/fit.ts — 학년 적합성. AI 없음, 순수 함수.
//
// abc-english-framework grade-bounds.json 을 그대로 대조한다. 유형으로 난이도를
// 말하지 않는다(AKU 실측: 집단 내 상관 0.071). 난이도는 여기서만 잰다.
import bounds from "./grade-bounds.json"
import type { Measures } from "./measure"

export type Verdict = "ok" | "over" | "under" | "unknown"

export interface FitResult {
  grade: string           // KES 학년 키 (middle1 …)
  boundsGrade: string     // 대조에 쓴 grade-bounds 키 (중1 …)
  verdict: Verdict
  reasons: string[]
  /** grade-bounds 가 고1까지라 고2·고3은 고1 기준으로 본다는 표시 */
  approximated: boolean
}

const KES_TO_BOUNDS: Record<string, string> = {
  elementary3: "초3", elementary4: "초4", elementary5: "초5", elementary6: "초6",
  middle1: "중1", middle2: "중2", middle3: "중3",
  high1: "고1", high2: "고1", high3: "고1",
}

interface GradeBound {
  grade: string
  lexile_min: number; lexile_max: number
  fk_min: number; fk_max: number
  words_min: number; words_max: number
  sentences_min: number; sentences_max: number
  sentence_max_words: number
  hard_reject_on: string[]
  soft_warn_on: string[]
}

export function gradeFit(m: Measures, grade: string, lexile?: number | null): FitResult {
  const key = KES_TO_BOUNDS[grade]
  const b = (bounds.grades as GradeBound[]).find((g) => g.grade === key)
  if (!b) return { grade, boundsGrade: key ?? "?", verdict: "unknown", reasons: ["이 학년의 기준이 없다"], approximated: false }

  const reasons: string[] = []
  let over = 0, under = 0

  if (m.words > b.words_max) { over++; reasons.push(`낱말 ${m.words} > ${key} 상한 ${b.words_max}`) }
  if (m.words < b.words_min) { under++; reasons.push(`낱말 ${m.words} < ${key} 하한 ${b.words_min}`) }
  if (m.fleschKincaid > b.fk_max) { over++; reasons.push(`FK ${m.fleschKincaid} > ${key} 상한 ${b.fk_max}`) }
  if (m.fleschKincaid < b.fk_min) { under++; reasons.push(`FK ${m.fleschKincaid} < ${key} 하한 ${b.fk_min}`) }
  if (m.longestSentenceWords > b.sentence_max_words)
    reasons.push(`가장 긴 문장 ${m.longestSentenceWords}낱말 > ${key} 권장 ${b.sentence_max_words} (경고)`)
  if (lexile != null) {
    if (lexile > b.lexile_max) { over++; reasons.push(`Lexile ${lexile} > ${key} 상한 ${b.lexile_max}`) }
    if (lexile < b.lexile_min) { under++; reasons.push(`Lexile ${lexile} < ${key} 하한 ${b.lexile_min}`) }
  } else {
    reasons.push("Lexile 은 재지 않았다 (낱말수·FK 로만 판정)")
  }

  const verdict: Verdict = over > 0 ? "over" : under > 0 ? "under" : "ok"
  return { grade, boundsGrade: key, verdict, reasons, approximated: grade === "high2" || grade === "high3" }
}

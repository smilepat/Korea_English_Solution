// lib/text-type/index.ts — 지문 하나를 넣으면 유형 판정 전부를 돌려준다.
//
//   ① 재기      measure   AI 없음
//   ② 겉모양    forms     AI 없음  — 편지·대화·안내·광고
//   ③ 판정자    judge     AI (3인, 서로 못 봄)
//   ④ 모으기    aggregate AI 없음  — 목적 다수결 · 전개 방식 전원 동의 집합 · 근거 검증
//   ⑤ 적합성    fit       AI 없음  — 학년 기준 대조
//
// 유형으로 난이도를 말하지 않는다. 난이도는 ⑤ 에서만 잰다.
import { measure, type Measures } from "./measure"
import { detectForm, type FormResult } from "./forms"
import { askRaters, DEFAULT_RATERS, type Rater } from "./judge"
import { aggregate, type Aggregated, type RaterVote } from "./aggregate"
import { gradeFit, type FitResult } from "./fit"

export interface TextTypeAnalysis {
  measures: Measures
  form: FormResult
  type: Aggregated
  fit: FitResult
  raters: RaterVote[]
  analyzedAt: string
}

export interface AnalyzeOptions {
  grade: string             // KES 학년 키 (middle1 …)
  lexile?: number | null    // 외부에서 잰 값이 있으면
  raters?: Rater[]
}

export async function analyzePassage(text: string, opts: AnalyzeOptions): Promise<TextTypeAnalysis> {
  const clean = text.replace(/\r/g, "").trim()
  const measures = measure(clean)
  const form = detectForm(clean)
  const raters = await askRaters(clean, opts.raters ?? DEFAULT_RATERS)
  const type = aggregate(raters, clean, form.form)
  const fit = gradeFit(measures, opts.grade, opts.lexile ?? null)
  return { measures, form, type, fit, raters, analyzedAt: new Date().toISOString() }
}

export { measure, detectForm, aggregate, gradeFit, askRaters, DEFAULT_RATERS }
export type { Measures, FormResult, Aggregated, RaterVote, FitResult, Rater }

"use server"

// 지문 → 유형 판정 (M1). 지문 원문은 저장하지 않는다 — 해시와 결과만.
import { createHash } from "node:crypto"
import { analyzePassage, type TextTypeAnalysis } from "@/lib/text-type"
import { readingStandards, type StandardCandidate } from "@/lib/text-type/standards"
import { checkGenRate, getClientIp } from "@/lib/kcsdb-guard"

export interface AnalyzeTextTypeResult {
  ok: true
  passageHash: string
  analysis: TextTypeAnalysis
  standards: StandardCandidate[]
}
export interface AnalyzeTextTypeError { ok: false; error: string }

const MIN_WORDS = 40
const MAX_CHARS = 6000

export async function analyzeTextType(params: {
  text: string
  grade: string
  lexile?: number | null
}): Promise<AnalyzeTextTypeResult | AnalyzeTextTypeError> {
  const text = (params.text ?? "").replace(/\r/g, "").trim()
  if (text.length > MAX_CHARS) return { ok: false, error: `지문이 너무 깁니다 (${MAX_CHARS}자 이내).` }
  if ((text.match(/[A-Za-z][A-Za-z'-]*/g)?.length ?? 0) < MIN_WORDS)
    return { ok: false, error: `지문이 너무 짧습니다 (영어 ${MIN_WORDS}낱말 이상).` }

  const ip = await getClientIp()
  if (!(await checkGenRate(ip))) return { ok: false, error: "요청이 잦습니다. 잠시 뒤 다시 시도하세요." }

  try {
    const [analysis, standards] = await Promise.all([
      analyzePassage(text, { grade: params.grade, lexile: params.lexile ?? null }),
      readingStandards(params.grade),
    ])
    const passageHash = createHash("sha256").update(text).digest("hex")
    return { ok: true, passageHash, analysis, standards }
  } catch (e) {
    console.error("[text-type] 판정 실패:", e)
    return { ok: false, error: "유형 판정 중 오류가 났습니다." }
  }
}

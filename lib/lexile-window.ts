// ============================================================
// lib/lexile-window.ts — 지문 난이도 타겟팅 (순수 함수, 테스트 대상)
//
// 학생 진단값에서 "이 반/이 학생에게 맞는 지문 Lexile 창"을 계산한다.
// 교사 대면 척도는 Lexile 단일(설계 결정). theta·CEFR 는 표시용으로만 환산한다.
// ============================================================

/** CEFR → 대략 Lexile 중앙값(추정, 표시·타겟팅용). */
const CEFR_LEXILE: Record<string, number> = {
  A1: 200,
  A2: 400,
  B1: 700,
  B2: 950,
  C1: 1150,
  C2: 1300,
}

/**
 * theta(2PL, 대략 -3..+3) → Lexile 추정.
 * vocab-cat 은 어휘 능력이라 정밀 독해 Lexile 은 아니지만, 지문 타겟 초기값으로 쓴다.
 * 앵커: theta 0 ≈ 600L, 기울기 ≈ 180L/logit. 명시적으로 "추정"이다.
 */
export function thetaToLexile(theta: number): number {
  return Math.round(600 + theta * 180)
}

export function cefrToLexile(cefr: string | null | undefined): number | null {
  if (!cefr) return null
  return CEFR_LEXILE[cefr.toUpperCase()] ?? null
}

export interface LexilePoint {
  scale: "lexile" | "theta_2pl" | "cefr"
  valueNum?: number | null
  valueText?: string | null
}

/** 한 학생의 여러 스냅샷에서 대표 Lexile 값 하나를 뽑는다(우선순위: lexile > theta > cefr). */
export function pointToLexile(p: LexilePoint): number | null {
  if (p.scale === "lexile" && p.valueNum != null) return p.valueNum
  if (p.scale === "theta_2pl" && p.valueNum != null) return thetaToLexile(p.valueNum)
  if (p.scale === "cefr") return cefrToLexile(p.valueText)
  return null
}

export interface LexileWindow {
  min: number
  max: number
  center: number
  n: number // 계산에 쓰인 학생 수
}

/**
 * 학생들의 대표 Lexile 값 집합 → 지문 검색 창.
 * 중앙값을 중심으로 ±band 를 기본으로 하되, 반 편차가 크면 창을 넓힌다
 * (한 지문으로 전원을 커버할 수 없을 때 교사가 그룹을 나누도록 분포를 반영).
 */
export function deriveLexileWindow(
  lexiles: number[],
  opts: { band?: number; floor?: number; ceil?: number } = {},
): LexileWindow | null {
  const vals = lexiles.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (vals.length === 0) return null

  const band = opts.band ?? 150
  const floor = opts.floor ?? 0
  const ceil = opts.ceil ?? 1600

  const mid = vals[Math.floor(vals.length / 2)]
  const lo = vals[0]
  const hi = vals[vals.length - 1]

  // 창은 [중앙-band, 중앙+band] 이되, 실제 최저·최고 학생을 최소한 담도록 확장
  const min = Math.max(floor, Math.min(mid - band, lo))
  const max = Math.min(ceil, Math.max(mid + band, hi))

  return { min, max, center: mid, n: vals.length }
}

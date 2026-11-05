// lib/text-type/aggregate.ts — 판정자 여럿의 답을 하나로 모은다. AI 없음, 순수 함수.
//
// M0 가 정한 것
//   축 A(목적)  : 다수결. 3/3 이면 high. 갈리면 ask — 단, 겉모양(형식)이 잡혔으면 묻지 않는다.
//   축 B(전개)  : 방식마다 있다/없다 → 전원 동의한 것만 남긴다. 하나로 뽑지 않는다.
//   상세화·인과 : 85~100% 늘 '있다'라 변별이 없다. 남기되 alwaysOn 으로 표시한다.
//   근거        : 지문에 실제로 있는 문장만. (판정자가 지어낸 근거는 걸러낸다)
import type { Form } from "./forms"
import { formImpliesPurpose } from "./forms"

export type Purpose = "narrative" | "social" | "informative" | "argumentative"
export type Method =
  | "narration" | "classification" | "cause_effect" | "definition" | "elaboration"
  | "exemplification" | "comparison" | "contrast" | "problem_solution"

export const ALWAYS_ON: ReadonlySet<Method> = new Set(["elaboration", "cause_effect"])

export interface RaterVote {
  rater: string
  purpose: Purpose | null
  purposeEvidence: string[]
  methods: Partial<Record<Method, { present: boolean; evidence: string | null }>>
}

export interface Aggregated {
  purpose: Purpose | null
  purposeVotes: number
  purposeRunnerUp: Purpose | null
  confidence: "high" | "ask"
  /** 형식이 목적 갈림을 덮었는가 (편지·대화·안내·광고) */
  formLed: boolean
  methodsPresent: Method[]
  alwaysOn: Method[]
  evidence: Partial<Record<Method | "purpose", string>>
  raterCount: number
}

export function isGrounded(evidence: string | null | undefined, text: string): boolean {
  if (!evidence) return false
  const hay = text.replace(/\s+/g, " ").toLowerCase()
  const needle = evidence.replace(/\s+/g, " ").toLowerCase().slice(0, 60)
  return needle.length >= 12 && hay.includes(needle)
}

export function aggregate(votes: RaterVote[], text: string, form: Form): Aggregated {
  const n = votes.length

  // 축 A — 다수결
  const tally = new Map<Purpose, number>()
  for (const v of votes) if (v.purpose) tally.set(v.purpose, (tally.get(v.purpose) ?? 0) + 1)
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1])
  let purpose = ranked[0]?.[0] ?? null
  let purposeVotes = ranked[0]?.[1] ?? 0
  const runnerUp = ranked[1]?.[0] ?? null

  // 뒷그물: 형식은 있는데 판정자가 아무 목적도 못 냈으면 형식이 시사하는 목적을 쓴다
  const implied = formImpliesPurpose(form)
  if (!purpose && implied) { purpose = implied; purposeVotes = 0 }

  const formLed = form !== "none"
  const unanimous = n > 0 && purposeVotes === n
  const confidence: "high" | "ask" = unanimous || formLed ? "high" : "ask"

  // 축 B — 전원 동의 집합
  const allMethods: Method[] = ["narration", "classification", "cause_effect", "definition",
    "elaboration", "exemplification", "comparison", "contrast", "problem_solution"]
  const methodsPresent = allMethods.filter((m) => n > 0 && votes.every((v) => v.methods[m]?.present))

  // 근거 — 지문에 실재하는 것만, 판정자 순서대로 첫 것
  const evidence: Aggregated["evidence"] = {}
  for (const m of methodsPresent) {
    for (const v of votes) {
      const e = v.methods[m]?.evidence
      if (isGrounded(e, text)) { evidence[m] = e!; break }
    }
  }
  for (const v of votes) {
    const e = v.purposeEvidence.find((x) => isGrounded(x, text))
    if (e) { evidence.purpose = e; break }
  }

  return {
    purpose, purposeVotes, purposeRunnerUp: runnerUp, confidence, formLed,
    methodsPresent,
    alwaysOn: methodsPresent.filter((m) => ALWAYS_ON.has(m)),
    evidence, raterCount: n,
  }
}

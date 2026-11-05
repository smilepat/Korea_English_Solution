// 유형 판정 엔진의 AI 없는 조각들. 실패할 수 있는 검사만 둔다.
import { describe, it, expect } from "vitest"
import { measure, splitSentences, syllables } from "@/lib/text-type/measure"
import { detectForm } from "@/lib/text-type/forms"
import { gradeFit } from "@/lib/text-type/fit"
import { aggregate, isGrounded, type RaterVote } from "@/lib/text-type/aggregate"

const LETTER = `Dear Ms. Green,
My name is Donna Williams, a science teacher at Rogan High School. I am writing to ask whether your museum could host our students on May 3. We would be grateful for a guided tour. Please let me know if this is possible.
Sincerely,
Donna Williams`

const DIALOGUE = `Pete: Hi! Are you Anna? Anna: Yes! Hi there! Are you Pete? Pete: I am Pete. Anna: Nice to meet you. Pete: Welcome to Irving Street! Anna: My new apartment!`

const NOTICE = `Spring Reading Festival will be held on Saturday, April 12 at 2:00 p.m. in the school library. Registration is required. The deadline is April 5. For more information, please contact the library.`

const PROSE = `Digital platforms have made a lot of work less sticky. As work becomes ever more flexible, workers move between projects. However, this flexibility comes at a cost. For example, many workers report feeling less loyal to their employers.`

describe("measure", () => {
  it("낱말·문장을 센다", () => {
    const m = measure(PROSE)
    expect(m.words).toBe(38)
    expect(m.sentences).toBe(4)
    expect(m.longestSentenceWords).toBeGreaterThanOrEqual(10)
  })
  it("문장 분리가 약어 뒤 공백에 속지 않는다", () => {
    expect(splitSentences("It was 2:00 p.m. We left. Then we ate.")).toHaveLength(3)
  })
  it("음절 근사", () => {
    expect(syllables("cat")).toBe(1)
    expect(syllables("flexible")).toBe(3)
    expect(syllables("employers")).toBe(3)
  })
})

describe("detectForm", () => {
  it("편지는 편지로", () => {
    const f = detectForm(LETTER)
    expect(f.form).toBe("letter")
    expect(f.signals.some((s) => s.includes("Dear"))).toBe(true)
  })
  it("대화는 대화로", () => expect(detectForm(DIALOGUE).form).toBe("dialogue"))
  it("안내문은 안내로", () => expect(detectForm(NOTICE).form).toBe("notice"))
  it("학술 산문은 none — 표지 없이 형식을 지어내지 않는다", () => expect(detectForm(PROSE).form).toBe("none"))
  it("초대 편지는 안내 표지가 많아도 편지가 이긴다", () => {
    const f = detectForm(`Dear Students,\nThe school festival will be held on Friday, May 9 at 6:00 p.m. Registration closes May 2. For more information visit the office.\nBest regards,\nThe Committee`)
    expect(f.form).toBe("letter")
  })
})

describe("gradeFit", () => {
  it("중2 상한을 넘는 긴 학술문은 over", () => {
    const long = Array(40).fill("Nevertheless, institutional accountability requires transparent deliberation among stakeholders.").join(" ")
    const f = gradeFit(measure(long), "middle2")
    expect(f.verdict).toBe("over")
    expect(f.reasons.some((r) => r.includes("낱말"))).toBe(true)
  })
  it("중1 하한 아래 짧은 글은 under", () => {
    expect(gradeFit(measure("I like cats. Cats are cute."), "middle1").verdict).toBe("under")
  })
  it("고2·고3 은 고1 기준으로 보고 그렇다고 표시한다", () => {
    const f = gradeFit(measure(PROSE), "high3")
    expect(f.boundsGrade).toBe("고1")
    expect(f.approximated).toBe(true)
  })
  it("모르는 학년은 unknown", () => expect(gradeFit(measure(PROSE), "kinder").verdict).toBe("unknown"))
})

function vote(rater: string, purpose: RaterVote["purpose"], present: string[], ev?: string): RaterVote {
  const methods: RaterVote["methods"] = {}
  for (const m of ["narration", "classification", "cause_effect", "definition", "elaboration",
    "exemplification", "comparison", "contrast", "problem_solution"] as const)
    methods[m] = { present: present.includes(m), evidence: present.includes(m) ? (ev ?? null) : null }
  return { rater, purpose, purposeEvidence: ev ? [ev] : [], methods }
}

describe("aggregate", () => {
  const EV = "However, this flexibility comes at a cost."
  it("3/3 목적 일치면 high, 전원 동의 방식만 남는다", () => {
    const a = aggregate([
      vote("a", "informative", ["contrast", "exemplification", "elaboration"], EV),
      vote("b", "informative", ["contrast", "elaboration"], EV),
      vote("c", "informative", ["contrast", "elaboration", "cause_effect"], EV),
    ], PROSE, "none")
    expect(a.purpose).toBe("informative")
    expect(a.confidence).toBe("high")
    expect(a.methodsPresent).toEqual(["elaboration", "contrast"])
    expect(a.alwaysOn).toEqual(["elaboration"])
    expect(a.evidence.contrast).toBe(EV)
  })
  it("2/1 로 갈리고 형식이 없으면 ask + 2순위", () => {
    const a = aggregate([
      vote("a", "argumentative", ["contrast"]),
      vote("b", "informative", ["contrast"]),
      vote("c", "argumentative", ["contrast"]),
    ], PROSE, "none")
    expect(a.confidence).toBe("ask")
    expect(a.purpose).toBe("argumentative")
    expect(a.purposeRunnerUp).toBe("informative")
  })
  it("갈려도 편지면 되묻지 않는다 — 형식이 활동을 정한다", () => {
    const a = aggregate([
      vote("a", "informative", []), vote("b", "social", []), vote("c", "argumentative", []),
    ], LETTER, "letter")
    expect(a.confidence).toBe("high")
    expect(a.formLed).toBe(true)
  })
  it("판정자가 목적을 못 내면 형식이 시사하는 목적을 뒷그물로 쓴다", () => {
    const a = aggregate([vote("a", null, []), vote("b", null, [])], LETTER, "letter")
    expect(a.purpose).toBe("social")
    expect(a.purposeVotes).toBe(0)
  })
  it("지어낸 근거는 버린다", () => {
    const a = aggregate([
      vote("a", "informative", ["contrast"], "This sentence is not in the passage at all."),
      vote("b", "informative", ["contrast"], EV),
    ], PROSE, "none")
    expect(a.evidence.contrast).toBe(EV)
    expect(isGrounded("This sentence is not in the passage at all.", PROSE)).toBe(false)
  })
  it("판정자 0명이면 아무것도 단정하지 않는다", () => {
    const a = aggregate([], PROSE, "none")
    expect(a.purpose).toBeNull()
    expect(a.methodsPresent).toEqual([])
  })
})

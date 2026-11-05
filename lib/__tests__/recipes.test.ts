// 레시피 고르기 — 실패할 수 있는 검사만. K2 (활동이 유형을 따라 갈리는가) 포함.
import { describe, it, expect } from "vitest"
import { loadRecipes } from "@/lib/recipes/load"
import { matches, selectLesson, specificity, type SelectionInput } from "@/lib/recipes/select"

const R = loadRecipes()
const base = (o: Partial<SelectionInput>): SelectionInput => ({
  form: "none", purpose: null, methodsPresent: [], alwaysOn: [], grade: "middle2", ...o,
})
const ids = (s: ReturnType<typeof selectLesson>) =>
  [s.pre, ...s.while, s.post, ...s.home].filter(Boolean).map((r) => r!.id)
const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b)
  const inter = [...A].filter((x) => B.has(x)).length
  return inter / new Set([...a, ...b]).size
}

describe("레시피 원장", () => {
  it("24개 이상 실려 있다", () => expect(R.length).toBeGreaterThanOrEqual(24))
})

describe("matches — 갈고리 규칙", () => {
  it("상세화·인과만 있는 글에는 방식 레시피가 걸리지 않는다", () => {
    const a = base({ methodsPresent: ["elaboration", "cause_effect"], alwaysOn: ["elaboration", "cause_effect"] })
    for (const r of R.filter((x) => x.hooks.methods.length)) expect(matches(r, a)).toBe(false)
  })
  it("편지 레시피는 목적이 무엇이든 편지에 걸린다 — 형식이 활동을 정한다", () => {
    const letterRecipes = R.filter((x) => x.hooks.forms.includes("letter"))
    expect(letterRecipes.length).toBeGreaterThan(0)
    for (const p of ["social", "informative", "argumentative"] as const)
      for (const r of letterRecipes) expect(matches(r, base({ form: "letter", purpose: p }))).toBe(true)
  })
  it("학년이 맞지 않으면 걸리지 않는다", () => {
    const r = R.find((x) => !x.grades.includes("middle1"))!
    expect(matches(r, base({ grade: "middle1", form: "letter", purpose: "social",
      methodsPresent: ["narration", "contrast", "definition", "comparison", "classification", "exemplification", "problem_solution"] }))).toBe(false)
  })
  it("구체성: 방식·형식 3 > 목적 2 > 범용 1", () => {
    expect(specificity(R.find((x) => x.id === "narration-timeline-rebuild")!)).toBe(3)
    expect(specificity(R.find((x) => x.id === "argumentative-counter")!)).toBe(2)
    expect(specificity(R.find((x) => x.id === "pre-title-predict")!)).toBe(1)
  })
})

describe("selectLesson", () => {
  it("같은 입력·같은 seed 면 같은 세트", () => {
    const a = base({ purpose: "argumentative", methodsPresent: ["contrast", "exemplification", "elaboration"], alwaysOn: ["elaboration"] })
    expect(ids(selectLesson(R, a, { seed: 7 }))).toEqual(ids(selectLesson(R, a, { seed: 7 })))
  })
  it("pre · while · post · home 을 전부 채운다 (방식 집합이 비어도 범용으로)", () => {
    const s = selectLesson(R, base({ purpose: "informative" }), { seed: 1 })
    expect(s.pre).not.toBeNull(); expect(s.while.length).toBeGreaterThan(0)
    expect(s.post).not.toBeNull(); expect(s.home.length).toBe(1)
    expect(s.minutes).toBeGreaterThanOrEqual(15); expect(s.minutes).toBeLessThanOrEqual(45)
  })
  it("구체적인 레시피가 범용보다 먼저 온다", () => {
    const s = selectLesson(R, base({ purpose: "argumentative", methodsPresent: ["contrast"] }), { seed: 3 })
    expect(s.while[0].hooks.methods.includes("contrast") || s.while[0].hooks.purposes.includes("argumentative")).toBe(true)
  })
  it("숙제는 혼자 할 수 있고 점검 방법이 있다", () => {
    for (const seed of [1, 2, 3]) {
      const s = selectLesson(R, base({ purpose: "narrative", methodsPresent: ["narration"] }), { seed })
      for (const h of s.home) { expect(h.grouping).toBe("individual"); expect(h.selfCheck).toBeTruthy() }
    }
  })
})

describe("K2 · 활동이 유형을 따라 갈리는가", () => {
  it("같은 학년의 서사문과 논증문은 활동 세트가 절반 이상 다르다", () => {
    const story = selectLesson(R, base({ purpose: "narrative", methodsPresent: ["narration", "elaboration"], alwaysOn: ["elaboration"] }), { seed: 11 })
    const argue = selectLesson(R, base({ purpose: "argumentative", methodsPresent: ["contrast", "exemplification", "cause_effect"], alwaysOn: ["cause_effect"] }), { seed: 11 })
    const j = jaccard(ids(story), ids(argue))
    expect(j).toBeLessThan(0.5)
  })
  it("편지와 안내문도 서로 다른 세트를 받는다", () => {
    const letter = selectLesson(R, base({ form: "letter", purpose: "social" }), { seed: 5 })
    const notice = selectLesson(R, base({ form: "notice", purpose: "informative" }), { seed: 5 })
    expect(jaccard(ids(letter), ids(notice))).toBeLessThan(0.5)
    expect(ids(letter).some((id) => id.startsWith("letter-"))).toBe(true)
    expect(ids(notice).some((id) => id.startsWith("notice-"))).toBe(true)
  })
  it("방식 집합이 빈 편지는 편지 활동으로 채워진다 — 빈손이 아니다", () => {
    const s = selectLesson(R, base({ form: "letter", purpose: "informative" }), { seed: 9 })
    expect(s.while.length + (s.post ? 1 : 0)).toBeGreaterThanOrEqual(2)
    expect(ids(s).filter((id) => id.startsWith("letter-")).length).toBeGreaterThanOrEqual(2)
  })
})

// 빈칸 채우기의 AI 없는 부분 — 지문에 없는 것을 걸러내는가, 템플릿이 제대로 채워지는가.
import { describe, it, expect } from "vitest"
import { groundValues, groundedIn, isComplete, renderTemplate } from "@/lib/recipes/fill"
import type { Recipe } from "@/lib/recipes/types"

const TEXT = `Dear Ms. Green, My name is Donna Williams, a science teacher at Rogan High School. I am writing to ask whether your museum could host our students on May 3. We would be grateful for a guided tour. Please let me know if this is possible. Sincerely, Donna Williams`

const recipe: Recipe = {
  id: "t", titleKo: "t", stage: "post", skill: "writing", grades: ["middle2"], minutes: 5, grouping: "individual", layer: "practice",
  hooks: { forms: ["letter"], purposes: [], methods: [] },
  slots: [
    { key: "asks", kind: "sentence_list", n: 3, from: "passage", rule: "" },
    { key: "sender", kind: "word_list", n: 1, from: "passage", rule: "" },
    { key: "questions", kind: "question_list", n: 2, from: "generated", rule: "" },
  ],
  studentText: "{{sender}}에게 답하세요. 바란 것 {{asks.n}}개:\n{{asks}}\n{{questions}}",
  teacherNote: "n",
}

describe("groundedIn", () => {
  it("문장은 앞 60자로, 낱말은 통째로 찾는다", () => {
    expect(groundedIn("I am writing to ask whether your museum could host our students on May 3.", TEXT, "sentence")).toBe(true)
    expect(groundedIn("Donna Williams", TEXT, "word_list")).toBe(true)
    expect(groundedIn("guided tour", TEXT, "phrase_list")).toBe(true)
  })
  it("지어낸 문장과 바꿔 쓴 문장은 거른다", () => {
    expect(groundedIn("She asked the museum to give a tour.", TEXT, "sentence")).toBe(false)
    expect(groundedIn("Mr. Brown", TEXT, "word_list")).toBe(false)
  })
  it("따옴표 모양과 공백 차이는 봐준다", () => {
    expect(groundedIn("We  would be grateful for a guided tour.", TEXT, "sentence")).toBe(true)
  })
})

describe("groundValues", () => {
  it("passage slot 에서 지문에 없는 항목만 걷어내고 generated 는 그대로 둔다", () => {
    const { values, dropped } = groundValues(recipe, {
      asks: ["Please let me know if this is possible.", "Could you send a bus?", "We would be grateful for a guided tour."],
      sender: "Donna Williams",
      questions: ["Who wrote the letter?", "When is the visit?"],
    }, TEXT)
    expect(values.asks).toEqual(["Please let me know if this is possible.", "We would be grateful for a guided tour."])
    expect(dropped.asks).toEqual(["Could you send a bus?"])
    expect(values.questions).toHaveLength(2)
    expect(values.sender).toBe("Donna Williams")
  })
  it("단일 slot 이 지어낸 값이면 값 없이 dropped 에 남는다", () => {
    const { values, dropped } = groundValues(recipe, { sender: "Mr. Brown" }, TEXT)
    expect(values.sender).toBeUndefined()
    expect(dropped.sender).toEqual(["Mr. Brown"])
  })
})

describe("isComplete", () => {
  it("리스트는 n 의 절반 이상, 문자열은 비어 있지 않아야 한다", () => {
    expect(isComplete(recipe, { asks: ["a", "b"], sender: "x", questions: ["q"] })).toBe(true)
    expect(isComplete(recipe, { asks: ["a"], sender: "x", questions: ["q"] })).toBe(false)
    expect(isComplete(recipe, { asks: ["a", "b"], sender: "", questions: ["q"] })).toBe(false)
  })
})

describe("renderTemplate", () => {
  it("{{key}} 는 값으로, {{key.n}} 는 개수로, 리스트는 줄마다 - 로", () => {
    const out = renderTemplate(recipe.studentText, { sender: "Donna", asks: ["A", "B"], questions: ["Q1"] })
    expect(out).toBe("Donna에게 답하세요. 바란 것 2개:\n- A\n- B\nQ1")
  })
  it("문장 안의 목록은 쉼표로, 한 개짜리는 그냥 값으로", () => {
    expect(renderTemplate("{{who}}에게 {{items}}을 보내세요.", { who: ["Donna"], items: ["a", "b"] })).toBe("Donna에게 a, b을 보내세요.")
  })
  it("빈 값은 교사가 채울 자리로 표시한다", () => {
    expect(renderTemplate("{{x}} / {{x.n}}", {})).toBe("［교사가 채울 것］ / ?")
  })
})

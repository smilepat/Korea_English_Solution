import { describe, it, expect } from "vitest"
import { parseGeminiJson } from "../gemini"

describe("parseGeminiJson", () => {
  it("순수 JSON 배열을 파싱한다", () => {
    expect(parseGeminiJson('[{"a":1}]')).toEqual([{ a: 1 }])
  })

  it("코드펜스를 제거한다", () => {
    expect(parseGeminiJson('```json\n[1,2,3]\n```')).toEqual([1, 2, 3])
  })

  it("한국어 서두가 붙어도 JSON 만 추출한다 (gemini-2.5-flash 실측 버그)", () => {
    const raw = '다음은 주어진 영어 지문에 대한 문항입니다:\n[{"type":"mcq","question":"Q"}]'
    expect(parseGeminiJson(raw)).toEqual([{ type: "mcq", question: "Q" }])
  })

  it("서두 + 코드펜스 + 후미 텍스트를 모두 견딘다", () => {
    const raw = '설명입니다.\n```json\n{"ok":true}\n```\n이상입니다.'
    expect(parseGeminiJson(raw)).toEqual({ ok: true })
  })

  it("객체를 파싱한다", () => {
    expect(parseGeminiJson('{"activities":[]}')).toEqual({ activities: [] })
  })

  it("배열과 객체가 섞이면 먼저 나오는 여는 괄호 기준으로 자른다", () => {
    // 서두에 '{' 없이 배열이 먼저 오는 경우
    const raw = 'result: [{"x":1},{"y":2}]'
    expect(parseGeminiJson(raw)).toEqual([{ x: 1 }, { y: 2 }])
  })

  it("깨진 JSON 은 throw 한다(호출부가 폴백하도록)", () => {
    expect(() => parseGeminiJson("not json at all")).toThrow()
  })
})

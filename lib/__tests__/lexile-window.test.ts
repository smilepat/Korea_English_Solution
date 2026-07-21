import { describe, it, expect } from "vitest"
import {
  thetaToLexile,
  cefrToLexile,
  pointToLexile,
  deriveLexileWindow,
} from "../lexile-window"

describe("thetaToLexile", () => {
  it("theta 0 은 앵커 600L", () => {
    expect(thetaToLexile(0)).toBe(600)
  })
  it("theta 가 오르면 Lexile 도 오른다", () => {
    expect(thetaToLexile(1)).toBe(780)
    expect(thetaToLexile(-1)).toBe(420)
  })
})

describe("cefrToLexile", () => {
  it("대문자·소문자 모두 매핑", () => {
    expect(cefrToLexile("B1")).toBe(700)
    expect(cefrToLexile("b1")).toBe(700)
  })
  it("모르는 값은 null", () => {
    expect(cefrToLexile("Z9")).toBeNull()
    expect(cefrToLexile(null)).toBeNull()
  })
})

describe("pointToLexile", () => {
  it("lexile 스냅샷은 그대로", () => {
    expect(pointToLexile({ scale: "lexile", valueNum: 850 })).toBe(850)
  })
  it("theta 는 환산", () => {
    expect(pointToLexile({ scale: "theta_2pl", valueNum: 0 })).toBe(600)
  })
  it("cefr 은 텍스트로 환산", () => {
    expect(pointToLexile({ scale: "cefr", valueText: "A2" })).toBe(400)
  })
  it("값 없으면 null", () => {
    expect(pointToLexile({ scale: "lexile", valueNum: null })).toBeNull()
  })
})

describe("deriveLexileWindow", () => {
  it("빈 입력은 null (아직 아무도 진단 안 봄)", () => {
    expect(deriveLexileWindow([])).toBeNull()
  })

  it("단일 학생은 중앙 ±band", () => {
    const w = deriveLexileWindow([700], { band: 150 })
    expect(w).toEqual({ min: 550, max: 850, center: 700, n: 1 })
  })

  it("편차가 크면 최저·최고 학생을 모두 담도록 창을 넓힌다", () => {
    // 300~1200 스프레드 — 한 지문으로 전원 커버 불가, 교사가 그룹 나누도록 분포 반영
    const w = deriveLexileWindow([300, 600, 700, 1200], { band: 150 })!
    expect(w.min).toBeLessThanOrEqual(300) // 최저 학생 포함
    expect(w.max).toBeGreaterThanOrEqual(1200) // 최고 학생 포함
    expect(w.n).toBe(4)
  })

  it("floor/ceil 을 넘지 않는다", () => {
    const w = deriveLexileWindow([100], { band: 200, floor: 0, ceil: 1600 })!
    expect(w.min).toBeGreaterThanOrEqual(0)
  })

  it("정렬되지 않은 입력도 중앙값을 정확히 잡는다", () => {
    const w = deriveLexileWindow([900, 300, 600])!
    expect(w.center).toBe(600)
  })
})

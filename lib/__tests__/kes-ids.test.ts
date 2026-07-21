import { describe, it, expect } from "vitest"
import {
  ulid,
  humanCode,
  normalizeCode,
  isValidCode,
  generateUniqueCode,
  HUMAN_ALPHABET,
  CODE_LENGTH,
} from "../kes-ids"

describe("ulid", () => {
  it("26자 고정 길이다", () => {
    expect(ulid()).toHaveLength(26)
  })

  it("시간순으로 정렬하면 생성순과 같다 (스냅샷 원장의 순서 보장)", () => {
    const early = ulid(1_700_000_000_000, () => 0.5)
    const later = ulid(1_700_000_001_000, () => 0.5)
    expect(early < later).toBe(true)
  })

  it("같은 밀리초에도 랜덤부가 달라 충돌하지 않는다", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(ulid(1_700_000_000_000))
    expect(seen.size).toBe(500)
  })

  it("Crockford Base32 문자만 쓴다 (I·L·O·U 없음)", () => {
    expect(ulid()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
  })
})

describe("humanCode", () => {
  it("기본 길이는 6자다", () => {
    expect(humanCode()).toHaveLength(CODE_LENGTH)
  })

  it("혼동 문자(0·1·I·L·O)를 절대 생성하지 않는다 — 종이 카드에서 읽어야 하므로", () => {
    for (let i = 0; i < 300; i++) {
      expect(humanCode()).not.toMatch(/[01ILO]/)
    }
  })

  it("모든 문자가 HUMAN_ALPHABET 소속이다", () => {
    for (const ch of humanCode(50)) {
      expect(HUMAN_ALPHABET).toContain(ch)
    }
  })
})

describe("normalizeCode", () => {
  it("소문자를 대문자로 바꾼다", () => {
    expect(normalizeCode("k7m2xz")).toBe("K7M2XZ")
  })

  it("공백과 하이픈을 제거한다", () => {
    expect(normalizeCode("K7M - 2XZ")).toBe("K7M2XZ")
  })

  it("복원 불가능한 오독 문자(0·1·I·L·O)는 임의 매핑하지 않고 제거한다", () => {
    // 0 이 D 였는지 Q 였는지 알 수 없다. 조용히 엉뚱한 반에 넣는 것보다
    // 길이 미달로 만들어 재확인을 유도하는 편이 안전하다.
    expect(normalizeCode("K0M1XZ")).toBe("KMXZ")
    expect(normalizeCode("ILO")).toBe("")
  })

  it("특수문자를 제거한다", () => {
    expect(normalizeCode("K7M@2X#Z")).toBe("K7M2XZ")
  })
})

describe("isValidCode", () => {
  it("정상 코드를 통과시킨다", () => {
    expect(isValidCode("K7M2XZ")).toBe(true)
    expect(isValidCode("k7m-2xz")).toBe(true)
  })

  it("오독 문자가 섞여 길이가 모자라면 거부한다", () => {
    expect(isValidCode("K0M1XZ")).toBe(false)
  })

  it("길이가 다르면 거부한다", () => {
    expect(isValidCode("K7M2X")).toBe(false)
    expect(isValidCode("K7M2XZQ")).toBe(false)
  })
})

describe("generateUniqueCode", () => {
  it("충돌하지 않으면 첫 코드를 반환한다", async () => {
    const code = await generateUniqueCode(async () => false)
    expect(code).toHaveLength(CODE_LENGTH)
  })

  it("충돌하면 재시도한다", async () => {
    let calls = 0
    const code = await generateUniqueCode(async () => {
      calls++
      return calls < 3 // 처음 2번은 이미 존재
    })
    expect(calls).toBe(3)
    expect(code).toHaveLength(CODE_LENGTH)
  })

  it("계속 충돌하면 조용히 중복을 반환하지 않고 실패한다", async () => {
    await expect(
      generateUniqueCode(async () => true, { maxAttempts: 5 }),
    ).rejects.toThrow(/고유 코드 생성 실패/)
  })
})

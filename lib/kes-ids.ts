// ============================================================
// kes_* 식별자 생성 — 순수 함수 (I/O 없음, 테스트 대상)
//
//  - ULID: 시간 정렬 가능한 128비트 ID. 학생·반·스냅샷의 PK.
//  - 조인 코드/토큰: 종이 카드에 인쇄해 학생이 눈으로 읽고 타이핑한다.
//    따라서 혼동 문자(O/0, I/1/L)를 알파벳에서 제거한다.
// ============================================================

/** Crockford Base32 — ULID 표준 알파벳 */
const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

/**
 * 사람이 종이에서 읽고 타이핑하는 코드용 알파벳.
 * O·0·I·1·L 제외 (중2 학생이 대문자 I와 숫자 1을 헷갈리지 않게).
 */
export const HUMAN_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"

export const CODE_LENGTH = 6

type RandomFn = () => number

function encodeTime(now: number, len: number): string {
  let out = ""
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % 32
    out = ULID_ALPHABET[mod] + out
    now = (now - mod) / 32
  }
  return out
}

function encodeRandom(len: number, rng: RandomFn): string {
  let out = ""
  for (let i = 0; i < len; i++) {
    out += ULID_ALPHABET[Math.floor(rng() * 32)]
  }
  return out
}

/**
 * ULID 생성. 26자, 앞 10자가 밀리초 타임스탬프라 사전순 정렬 = 시간순 정렬.
 * 인자는 테스트에서 결정론적으로 만들기 위한 주입점이다.
 */
export function ulid(now: number = Date.now(), rng: RandomFn = Math.random): string {
  return encodeTime(now, 10) + encodeRandom(16, rng)
}

/**
 * 반 조인 코드 / 학생 조인 토큰 생성.
 * 충돌은 호출부에서 UNIQUE 제약으로 잡고 재시도한다 (generateUniqueCode 참고).
 */
export function humanCode(length: number = CODE_LENGTH, rng: RandomFn = Math.random): string {
  let out = ""
  for (let i = 0; i < length; i++) {
    out += HUMAN_ALPHABET[Math.floor(rng() * HUMAN_ALPHABET.length)]
  }
  return out
}

/**
 * 학생이 입력한 코드를 정규화한다. 소문자·공백·하이픈을 허용한다.
 *
 * 0·1·I·L·O 는 애초에 생성되지 않는 문자다. 학생이 이런 글자를 입력했다면
 * 카드를 잘못 읽은 것이고, 원래 무슨 글자였는지는 복원할 수 없다
 * (0 은 D 였을 수도 Q 였을 수도 있다). 따라서 임의로 다른 글자에 매핑하지
 * 않고 제거한다 — 그 결과 길이가 모자라면 호출부에서 "코드를 다시 확인하라"고
 * 안내한다. 조용히 엉뚱한 반에 입장시키는 것보다 낫다.
 */
export function normalizeCode(input: string): string {
  const upper = input.toUpperCase().replace(/[\s-]/g, "")
  return Array.from(upper)
    .filter((ch) => HUMAN_ALPHABET.includes(ch))
    .join("")
}

/** 정규화 후 정확히 CODE_LENGTH 자인지. 입력 검증용. */
export function isValidCode(input: string, length: number = CODE_LENGTH): boolean {
  return normalizeCode(input).length === length
}

/**
 * UNIQUE 충돌 시 재시도하며 코드를 생성한다.
 * `exists` 는 DB 조회를 감싸는 콜백 (이 모듈은 I/O 를 하지 않는다).
 */
export async function generateUniqueCode(
  exists: (code: string) => Promise<boolean>,
  options: { length?: number; maxAttempts?: number; rng?: RandomFn } = {},
): Promise<string> {
  const { length = CODE_LENGTH, maxAttempts = 20, rng = Math.random } = options
  for (let i = 0; i < maxAttempts; i++) {
    const code = humanCode(length, rng)
    if (!(await exists(code))) return code
  }
  throw new Error(`고유 코드 생성 실패: ${maxAttempts}회 시도 후에도 충돌`)
}

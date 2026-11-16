// lib/text-type/forms.ts — 글의 겉모양(형식) 잡기. AI 없음, 순수 함수.
//
// M0 에서 축 A(목적)가 갈린 자리는 거의 전부 편지였다. 판정자는 속뜻(민원·요청)을
// 골랐고 고시는 편지를 '친교·사회적' 예시로 나열했다. 둘 다 틀리지 않았다.
// 그래서 편지·대화·안내문·광고는 겉모양으로 잡고, 활동도 겉모양에 건다.
// 겉모양이 잡히면 목적이 갈려도 교사에게 되묻지 않는다.
//
// 표지가 없는 편지(인사말 없이 시작하는 이메일 본문)는 놓친다. 그 경우는
// AI 목적 판정이 '친교'로 잡아 주는 것을 뒷그물로 둔다 — 두 겹.

export type Form = "letter" | "dialogue" | "notice" | "advertisement" | "none"

export interface FormResult {
  form: Form
  /** 잡힌 표지. 교사에게 "왜 편지로 봤나"를 보여 주는 데 쓴다. */
  signals: string[]
  scores: Record<Exclude<Form, "none">, number>
}

// 격식 인사말(Dear …)은 날짜·주소 줄 뒤에 올 수 있다("12th November Dear Daddy-Long-Legs,")
// — 첫 160자 안이면 본다. 가벼운 인사말(Hi/Hello)은 글의 맨 앞일 때만 — 대화문의 "Hi!" 와 섞이지 않게.
const LETTER_OPEN = /(?:^[\s\S]{0,160}?(?:^|\s)(?:dear\b|to whom it may concern)|^\s*(?:hi|hello|hey)\b[^!?]*,)/i
const LETTER_CLOSE = /\b(?:sincerely|best regards|kind regards|warm regards|yours truly|yours sincerely|best wishes|regards|love|cheers),?\s*(?:[A-Z][\w.' -]{0,40})?\s*$/i
const LETTER_BODY = [/\bi am writing (?:to|because|in)\b/i, /\bthank you for your (?:letter|email|message|reply)\b/i, /\blooking forward to hearing from you\b/i, /\bplease let me know\b/i]

const SPEAKER_LINE = /(?:^|\n|\s)([A-Z][a-zA-Z.]{0,14}(?: [A-Z][a-zA-Z.]{0,14})?|[A-Z]|Mr\.|Ms\.|Mrs\.|Dr\.)\s?:\s(?=[A-Z"“'])/g

const NOTICE_CUES: Array<[RegExp, string]> = [
  [/\bwill be held\b/i, "will be held"],
  [/\bfor more (?:information|details)\b/i, "for more information"],
  [/\bregist(?:er|ration)\b/i, "registration"],
  [/\bdeadline\b/i, "deadline"],
  [/\b(?:admission|entry|participation) fee\b|\bfee\b/i, "fee"],
  [/\b\d{1,2}(?::\d{2})?\s?(?:a\.?m\.?|p\.?m\.?)\b/i, "시각"],
  [/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, "요일"],
  [/\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i, "날짜"],
  [/\bplease (?:note|bring|contact|visit|arrive|check)\b/i, "please …"],
  [/\b(?:location|venue|place)\s*:/i, "장소:"],
  [/\b(?:date|time|when|where)\s*:/i, "일시:"],
]

const AD_CUES: Array<[RegExp, string]> = [
  [/\bjoin us\b/i, "join us"],
  [/\bdon'?t miss\b/i, "don't miss"],
  [/\bsign up\b/i, "sign up"],
  [/\b\d{1,3}\s?%\s?off\b|\bdiscount\b|\bspecial offer\b/i, "할인"],
  [/\bfree\b/i, "free"],
  [/\b(?:call|visit|order|book)\b.{0,30}\b(?:today|now)\b/i, "call/visit today"],
  [/\blimited\b/i, "limited"],
  [/\bonly \$?\d/i, "only $…"],
  [/!\s*$/m, "느낌표 문장"],
]

function count(cues: Array<[RegExp, string]>, text: string): [number, string[]] {
  const hit: string[] = []
  for (const [re, name] of cues) if (re.test(text)) hit.push(name)
  return [hit.length, hit]
}

export function detectForm(text: string): FormResult {
  const t = text.replace(/\r/g, "")
  const signals: string[] = []
  const scores = { letter: 0, dialogue: 0, notice: 0, advertisement: 0 }

  // 편지·이메일
  if (LETTER_OPEN.test(t)) { scores.letter += 2; signals.push("첫머리 인사(Dear …)") }
  if (LETTER_CLOSE.test(t.trim())) { scores.letter += 2; signals.push("맺음말(Sincerely …)") }
  for (const re of LETTER_BODY) if (re.test(t)) { scores.letter += 1; signals.push("편지 상투구"); break }

  // 대화
  const speakers = t.match(SPEAKER_LINE) ?? []
  const distinct = new Set(speakers.map((s) => s.trim().replace(/\s?:\s?$/, "")))
  if (speakers.length >= 3 && distinct.size >= 2) {
    scores.dialogue += Math.min(4, speakers.length)
    signals.push(`화자 표기 ${speakers.length}회 (${[...distinct].slice(0, 3).join(", ")})`)
  }

  // 안내·공지
  const [nN, nHits] = count(NOTICE_CUES, t)
  if (nN >= 2) { scores.notice += nN; signals.push(...nHits.map((h) => `안내 표지: ${h}`)) }

  // 광고
  const [aN, aHits] = count(AD_CUES, t)
  if (aN >= 2) { scores.advertisement += aN; signals.push(...aHits.map((h) => `광고 표지: ${h}`)) }

  // 안내와 광고가 같이 잡히면 점수로 가른다. 편지 표지가 있으면 편지가 이긴다 —
  // 초대장·모집 편지는 안내 표지도 많이 갖기 때문이다.
  const threshold = { letter: 2, dialogue: 3, notice: 2, advertisement: 2 }
  let form: Form = "none"
  if (scores.letter >= threshold.letter) {
    form = "letter"                                   // 편지 표지가 있으면 편지 — 점수와 무관
  } else {
    const order: Array<Exclude<Form, "none">> = ["dialogue", "notice", "advertisement"]
    const best = order.reduce((b, k) => (scores[k] > scores[b] ? k : b), order[0])
    if (scores[best] >= threshold[best]) form = best
  }
  return { form, signals, scores }
}

/** 형식이 축 A 의 어느 목적 범주를 강하게 시사하는가. 판정 대신 뒷그물·표시용. */
export function formImpliesPurpose(form: Form): "social" | "informative" | null {
  if (form === "letter" || form === "dialogue") return "social"
  if (form === "notice" || form === "advertisement") return "informative"
  return null
}

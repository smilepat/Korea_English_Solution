// lib/text-type/measure.ts — 지문 재기. AI 없음, 순수 함수.
//
// 파이프라인 ① "재는 단계". 낱말수·문장수·문장당 낱말·Flesch-Kincaid.
// Lexile 은 여기서 계산하지 않는다(모델이 필요). 값이 없으면 없다고 둔다.

export interface Measures {
  words: number
  sentences: number
  wordsPerSentence: number
  longestSentenceWords: number
  fleschKincaid: number
  paragraphs: number
}

const WORD = /[A-Za-z][A-Za-z'-]*/g

export function tokenize(text: string): string[] {
  return text.match(WORD) ?? []
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    // 마침표 뒤 공백이 빠진 텍스트("relaxation.We")도 문장으로 가른다. 약어("U.S.")는 뒤에
    // 소문자가 오거나 한 글자 대문자라 걸리지 않는다.
    .split(/(?<=[.!?])\s*(?=["'“‘(]?[A-Z][a-z]|["'“‘(]?[0-9①-⑩])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 음절 근사. 모음군 세고 말음 e 를 뺀다. 정확하지 않지만 FK 용으로는 충분하다. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!w) return 0
  if (w.length <= 3) return 1
  const stripped = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "")
  const groups = stripped.match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups?.length ?? 1)
}

export function measure(text: string): Measures {
  const toks = tokenize(text)
  const sents = splitSentences(text)
  const words = toks.length
  const sentences = Math.max(1, sents.length)
  const syl = toks.reduce((a, w) => a + syllables(w), 0)
  const longest = sents.reduce((m, s) => Math.max(m, tokenize(s).length), 0)
  const fk = words ? 0.39 * (words / sentences) + 11.8 * (syl / words) - 15.59 : 0
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length || 1
  return {
    words,
    sentences,
    wordsPerSentence: Math.round((words / sentences) * 10) / 10,
    longestSentenceWords: longest,
    fleschKincaid: Math.round(fk * 10) / 10,
    paragraphs,
  }
}

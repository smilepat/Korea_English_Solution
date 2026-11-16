// lib/text-type/judge.ts — 판정자 여럿을 부른다. 여기만 AI 를 쓴다.
//
// M0 의 프롬프트(experiments/M0-text-type/scripts/raters.py · raters_multi.py)를 그대로
// 옮겼다. 바꾸면 M0 수치가 이 코드를 보증하지 않는다.
//
//   · 판정자마다 다른 모델, 서로의 답을 보지 않는다
//   · 선택지 순서를 판정자마다 다르게 섞는다 — 목록 맨 위를 고르는 버릇을 깬다
//     (같은 모델에 순서만 바꿔 물었을 때 답이 27% 바뀌었다)
//   · 축 A 는 하나 고르기, 축 B 는 방식마다 있다/없다
import { callGemini } from "@/lib/gemini"
import types from "./text-types.json"
import type { Method, Purpose, RaterVote } from "./aggregate"

export interface Rater { id: string; model: string; seed: number }

/** M0 에서 쓴 셋. 계열이 다르고 3.8 은 문턱이 엄격하다(있다 2.9개 vs 5.4개). */
export const DEFAULT_RATERS: Rater[] = [
  { id: "flash", model: "gemini-2.5-flash", seed: 101 },
  { id: "pro", model: "gemini-2.5-pro", seed: 202 },
  { id: "g38", model: "gemini-3.8-flash", seed: 404 },
]

const PURPOSES = types.axis_a.purposes as Array<{ id: Purpose; name_ko: string; purpose_ko: string }>
const METHODS = types.axis_b.methods as Array<{ id: Method; name_ko: string; gloss_ko: string }>
const VALID_P = new Set(PURPOSES.map((p) => p.id))
const VALID_M = new Set(METHODS.map((m) => m.id))

// 결정론 셔플 (mulberry32) — seed 가 같으면 순서가 같다
function shuffled<T>(arr: T[], seed: number): T[] {
  let a = seed >>> 0
  const rnd = () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]] }
  return out
}

function purposePrompt(text: string, seed: number): string {
  const list = shuffled(PURPOSES, seed).map((p) => `  - ${p.id} · ${p.name_ko} — ${p.purpose_ko}`).join("\n")
  return `너는 한국 중·고등학교 영어 교사를 돕는 판정기다.
아래 영어 지문이 **무엇을 하려는 글인지(목적)** 를 판정한다.

목적 4범주는 2022 개정 영어과 교육과정 고시가 직접 나열한 것이다. 이 목록 밖의 이름을 지어내지 마라.
목록의 차례는 아무 뜻이 없다. 섞어 놓았다.

[목적] 하나만 고른다
${list}

판정 규칙
1. 난이도는 판정하지 않는다. 종류만 말한다.
2. 근거는 반드시 지문에 **그대로 있는 문장**을 인용한다. 바꿔 쓰지 마라.
3. 오직 JSON 만 출력한다.

{"purpose":"<id>","evidence":["지문 원문 문장","지문 원문 문장"]}

지문:
"""
${text}
"""`
}

function methodsPrompt(text: string, seed: number): string {
  const list = shuffled(METHODS, seed).map((m) => `  - ${m.id} · ${m.name_ko} — ${m.gloss_ko}`).join("\n")
  return `너는 한국 중·고등학교 영어 교사를 돕는 판정기다.
아래 영어 지문에 각각의 전개 방식이 **쓰였는지 아닌지**를 하나씩 판정한다.
하나만 고르는 것이 아니다. 여러 개가 함께 쓰였으면 여러 개가 모두 true 다.

전개 방식 (2022 개정 영어과 교육과정 고시가 나열한 것. 차례는 섞어 놓았고 아무 뜻이 없다)
${list}

판정 규칙
1. "글 전체가 그 방식이다"가 아니라 **"그 방식이 이 글 안에서 실제로 쓰였다"**면 true 다.
   다만 한 문장 스치듯 나온 것은 false 로 한다 — 그 방식으로 수업 활동 하나를
   만들 수 있을 만큼 재료가 있어야 true 다.
2. true 인 것은 반드시 지문에 **그대로 있는 문장**을 근거로 댄다. 바꿔 쓰지 마라.
3. 난이도는 판정하지 않는다.
4. 오직 JSON 만 출력한다. 9개 전부에 답한다.

{"methods":{"<id>":{"present":true,"evidence":"지문 원문 문장"},
            "<id>":{"present":false,"evidence":null}, ...}}

지문:
"""
${text}
"""`
}

function parseJson(raw: string): Record<string, unknown> {
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return {}
  try { return JSON.parse(m[0]) } catch { return {} }
}

async function ask(model: string, prompt: string): Promise<Record<string, unknown>> {
  try {
    const raw = await callGemini(prompt, undefined, { model, json: true, temperature: 0, maxOutputTokens: 4096 })
    return parseJson(raw)
  } catch (e) {
    console.error(`[text-type] ${model} 호출 실패:`, e instanceof Error ? e.message : e)
    return {}
  }
}

/** 판정자 한 명 — 목적 1회 + 전개 방식 1회. 둘은 서로 독립이라 같이 보낸다. */
export async function askRater(rater: Rater, text: string): Promise<RaterVote> {
  const [p, m] = await Promise.all([
    ask(rater.model, purposePrompt(text, rater.seed)),
    ask(rater.model, methodsPrompt(text, rater.seed)),
  ])
  const purpose = VALID_P.has(p.purpose as Purpose) ? (p.purpose as Purpose) : null
  const purposeEvidence = Array.isArray(p.evidence) ? (p.evidence as unknown[]).filter((x): x is string => typeof x === "string") : []
  const methods: RaterVote["methods"] = {}
  const ms = (m.methods ?? {}) as Record<string, unknown>
  for (const id of VALID_M) {
    const cell = ms[id]
    if (cell && typeof cell === "object") {
      const c = cell as { present?: unknown; evidence?: unknown }
      methods[id] = { present: c.present === true, evidence: typeof c.evidence === "string" ? c.evidence : null }
    } else {
      methods[id] = { present: false, evidence: null }
    }
  }
  return { rater: rater.id, purpose, purposeEvidence, methods }
}

/** 판정자 전원. 서로의 답을 보지 않으므로 병렬로 부른다. */
export async function askRaters(text: string, raters: Rater[] = DEFAULT_RATERS): Promise<RaterVote[]> {
  return Promise.all(raters.map((r) => askRater(r, text)))
}

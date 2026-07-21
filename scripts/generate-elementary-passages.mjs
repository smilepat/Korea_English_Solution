// scripts/generate-elementary-passages.mjs
// 초등 저학년(<300L 중심) 창작 지문 보강. 원천 데이터에 이 대역이 얇아서
// (dedup 후 <300L 50개) AI 로 생성한다. license='generated', source='ai-generated-elementary'
// 로 명확히 구분해 교사가 검토·선별할 수 있게 한다.
//
// 실행: node scripts/generate-elementary-passages.mjs
// 산출: data/passages/generated_elementary.jsonl (검토 후 seed-content 로 적재)
//
// ★ Lexile 은 LLM 으로 정밀 제어가 어렵다 — 목표 대역으로 생성하고 "추정" 라벨을
//   붙인다. 어린 학습자용이라 대역이 성기므로 실용상 충분하다.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, "..")

function loadEnv() {
  const p = join(ROOT, ".env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
  }
}
loadEnv()

const KEY = (process.env.GEMINI_API_KEY || "").trim()
const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash"
if (!KEY) {
  console.error("GEMINI_API_KEY 필요")
  process.exit(1)
}

// 관대한 JSON 추출(lib/gemini parseGeminiJson 와 동일 논리)
function parseJson(raw) {
  let s = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  const a = s.indexOf("["), o = s.indexOf("{")
  const start = a === -1 ? o : o === -1 ? a : Math.min(a, o)
  if (start > 0) {
    const close = s[start] === "[" ? "]" : "}"
    const end = s.lastIndexOf(close)
    if (end > start) s = s.slice(start, end + 1)
  }
  return JSON.parse(s)
}

async function gen(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 2048, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(60000),
    },
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

// 목표 대역(가장 얇은 150~400L 집중) × 장르, 어린 학습자 친숙 주제
const BANDS = [150, 200, 250, 300, 350, 400]
const GENRES = ["Narrative", "Informational", "Literary", "Procedural"]
const TOPICS = [
  "family", "school", "pets", "food", "seasons", "friends",
  "playground", "morning routine", "a rainy day", "my favorite toy",
  "helping at home", "a class trip",
]

function wordTarget(band) {
  if (band <= 200) return "35-55"
  if (band <= 300) return "50-70"
  return "70-95"
}

function prompt(band, genre, topic) {
  return `You write original English reading passages for young Korean EFL learners (elementary school).

Create ONE ${genre.toLowerCase()} passage.
- Target difficulty: about ${band}L (Lexile). Keep it VERY simple.
- Word count: ${wordTarget(band)} words.
- Topic: ${topic}.
- Use short sentences and common, high-frequency words a Korean elementary student knows.
- ${band <= 200 ? "Use mostly present tense and 5-8 word sentences." : "Keep sentences under 12 words."}
- Wholesome, culturally neutral or Korea-friendly content. No brand names.
- Do NOT include any questions, answer choices, or exam metadata. Passage text only.

Return ONLY JSON:
{"title":"...","body":"..."}`
}

function countWords(s) {
  return (s.trim().match(/\S+/g) || []).length
}

const out = []
let idSeq = 1
let done = 0
const total = BANDS.length * GENRES.length

for (const band of BANDS) {
  for (let gi = 0; gi < GENRES.length; gi++) {
    const genre = GENRES[gi]
    const topic = TOPICS[(idSeq - 1) % TOPICS.length]
    try {
      const raw = await gen(prompt(band, genre, topic))
      const p = parseJson(raw)
      if (!p.body || !p.title) throw new Error("빈 응답")
      const wc = countWords(p.body)
      const textId = `GEN-EL-${band}-${String(idSeq).padStart(3, "0")}`
      out.push({
        text_id: textId,
        lexile_score: band,
        lexile_band: `${Math.floor(band / 100) * 100}-${Math.floor(band / 100) * 100 + 100}`,
        age_group: "Lower Elementary",
        grade_hint: band <= 200 ? "초1-2" : band <= 350 ? "초3" : "초3-4",
        grade_band: "elementary",
        genre,
        topic: p.title,
        word_count: wc,
        sentence_count: (p.body.match(/[.!?]/g) || []).length,
        vocabulary_band: "elementary",
        intended_use: "초등 보충",
        text_body: p.body,
        source: "ai-generated-elementary",
        license: "generated",
      })
      done++
      console.log(`[${done}/${total}] ${textId} "${p.title}" ${band}L ${genre} (${wc}w)`)
    } catch (e) {
      console.error(`  ✗ ${band}L ${genre}: ${e.message}`)
    }
    idSeq++
  }
}

const dir = join(ROOT, "data", "passages")
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
const path = join(dir, "generated_elementary.jsonl")
writeFileSync(path, out.map((o) => JSON.stringify(o)).join("\n") + "\n", "utf8")
console.log(`\n[generate] ${out.length}/${total}개 생성 → data/passages/generated_elementary.jsonl`)

// lib/kcsdb-ai.ts — kcsdb 4모드 검색용 Gemini 호출(현행 모델)
// S3 임베딩: gemini-embedding-001(768d) / S4 생성: gemini-2.5-flash
const KEY = process.env.GEMINI_API_KEY
const BASE = "https://generativelanguage.googleapis.com/v1beta/models"

export async function embedQuery(text: string): Promise<number[]> {
  if (!KEY) throw new Error("GEMINI_API_KEY 미설정")
  const res = await fetch(`${BASE}/gemini-embedding-001:embedContent?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text: text.slice(0, 2000) }] },
      outputDimensionality: 768,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error("임베딩 오류 " + res.status)
  const d = await res.json()
  return d?.embedding?.values ?? []
}

export async function geminiGenerate(prompt: string): Promise<string> {
  if (!KEY) throw new Error("GEMINI_API_KEY 미설정")
  const res = await fetch(`${BASE}/gemini-2.5-flash:generateContent?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) throw new Error("생성 오류 " + res.status)
  const d = await res.json()
  return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

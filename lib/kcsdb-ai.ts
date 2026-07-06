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

export async function geminiGenerate(
  prompt: string,
  opts: { maxOutputTokens?: number; temperature?: number; thinkingBudget?: number } = {},
): Promise<string> {
  if (!KEY) throw new Error("GEMINI_API_KEY 미설정")
  const generationConfig: any = { temperature: opts.temperature ?? 0.2, maxOutputTokens: opts.maxOutputTokens ?? 1024 }
  // 구조화(JSON) 생성 시 thinkingBudget:0으로 사고 토큰이 출력 예산을 잠식하지 않게 한다(결정적·저비용).
  if (opts.thinkingBudget !== undefined) generationConfig.thinkingConfig = { thinkingBudget: opts.thinkingBudget }
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig })
  let res: Response | null = null
  // 5xx는 일시적 서버 오류가 잦아 1회 재시도.
  for (let attempt = 0; attempt < 2; attempt++) {
    res = await fetch(`${BASE}/gemini-2.5-flash:generateContent?key=${KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
      signal: AbortSignal.timeout(60000),
    })
    if (res.ok) break
    if (res.status < 500 || attempt === 1) throw new Error("생성 오류 " + res.status)
  }
  const d = await res!.json()
  // thinking이 켜지면 parts에 thought 파트가 섞일 수 있어 텍스트 파트를 모두 이어붙인다.
  const parts = d?.candidates?.[0]?.content?.parts ?? []
  return parts.map((p: any) => p?.text ?? "").join("") || (d?.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
}

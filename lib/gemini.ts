const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.")
  }

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Gemini API 오류 (${res.status}): ${errorText}`)
  }

  const data: GeminiResponse = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini 응답이 비어있습니다.")
  return text
}

const TEACHER_SYSTEM = `당신은 대한민국 영어교사를 지원하는 AI 어시스턴트입니다.
모든 응답은 한국어로 작성하되, 영어 교육 자료 생성 시에는 영어를 사용합니다.
2022 개정 교육과정, CEFR, Lexile 프레임워크에 대한 전문 지식을 갖추고 있습니다.`

export async function generateReadingMaterial(params: {
  lexileLevel: number
  topic: string
  wordCount: number
  genre: "narrative" | "expository" | "persuasive"
}): Promise<{
  title: string
  content: string
  vocabulary: string[]
  questions: Array<{ question: string; options: string[]; answer: number }>
}> {
  const prompt = `Generate an English reading passage with the following specifications:
- Lexile Level: approximately ${params.lexileLevel}L
- Topic: ${params.topic}
- Target word count: ${params.wordCount} words
- Genre: ${params.genre}

Guidelines for Lexile accuracy:
- For ${params.lexileLevel}L, use sentence length and vocabulary complexity appropriate to this level
- ${params.lexileLevel < 400 ? "Use simple sentences (8-12 words average), basic vocabulary" : ""}
- ${params.lexileLevel >= 400 && params.lexileLevel < 700 ? "Use moderate sentences (12-18 words average), some academic vocabulary" : ""}
- ${params.lexileLevel >= 700 && params.lexileLevel < 1000 ? "Use complex sentences (15-22 words average), academic vocabulary" : ""}
- ${params.lexileLevel >= 1000 ? "Use sophisticated sentences (18-25+ words average), advanced academic vocabulary" : ""}

Respond in JSON format:
{
  "title": "passage title in English",
  "content": "the full passage in English",
  "vocabulary": ["word1", "word2", "word3", "word4", "word5"],
  "questions": [
    {"question": "comprehension question in English", "options": ["A", "B", "C", "D"], "answer": 0},
    {"question": "...", "options": ["A", "B", "C", "D"], "answer": 1},
    {"question": "...", "options": ["A", "B", "C", "D"], "answer": 2}
  ]
}

Return ONLY valid JSON, no markdown formatting.`

  const text = await callGemini(prompt, TEACHER_SYSTEM)
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error("읽기 자료 생성 결과를 파싱할 수 없습니다.")
  }
}

export async function continueConversation(params: {
  scenario: string
  cefrLevel: string
  messages: Array<{ role: "student" | "ai"; content: string }>
  studentInput: string
}): Promise<{
  response: string
  feedback: { corrections: string[]; suggestions: string[]; encouragement: string }
}> {
  const history = params.messages.map((m) => `${m.role === "student" ? "Student" : "AI Partner"}: ${m.content}`).join("\n")

  const prompt = `You are an English conversation partner for a Korean student.
Scenario: ${params.scenario}
Student's CEFR Level: ${params.cefrLevel}

Conversation so far:
${history}

Student's latest message: "${params.studentInput}"

Respond naturally in English at ${params.cefrLevel} level. Then provide feedback on the student's English.

Respond in JSON:
{
  "response": "your natural English response continuing the conversation",
  "feedback": {
    "corrections": ["correction 1 in Korean explaining the grammar/vocab fix", "correction 2..."],
    "suggestions": ["better expression suggestion in Korean"],
    "encouragement": "encouraging comment in Korean"
  }
}

If the student's English is perfect, corrections can be empty array.
Return ONLY valid JSON.`

  const text = await callGemini(prompt, TEACHER_SYSTEM)
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error("대화 응답을 파싱할 수 없습니다.")
  }
}

export async function evaluateConversation(params: {
  scenario: string
  cefrLevel: string
  messages: Array<{ role: "student" | "ai"; content: string }>
}): Promise<{
  fluency: number
  accuracy: number
  vocabulary: number
  taskCompletion: number
  overall: string
  strengths: string[]
  improvements: string[]
}> {
  const history = params.messages.map((m) => `${m.role === "student" ? "Student" : "AI Partner"}: ${m.content}`).join("\n")

  const prompt = `Evaluate this English conversation by a Korean student.
Scenario: ${params.scenario}
Target CEFR Level: ${params.cefrLevel}

Conversation:
${history}

Provide evaluation in JSON:
{
  "fluency": 85,
  "accuracy": 70,
  "vocabulary": 75,
  "taskCompletion": 80,
  "overall": "전체 평가 요약 (한국어 2-3문장)",
  "strengths": ["잘한 점 1", "잘한 점 2"],
  "improvements": ["개선할 점 1", "개선할 점 2"]
}

Scores are 0-100. Return ONLY valid JSON.`

  const text = await callGemini(prompt, TEACHER_SYSTEM)
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error("대화 평가를 파싱할 수 없습니다.")
  }
}

export async function generateRubric(params: {
  grade: string
  skill: string
  topic: string
  cefrTarget: string
  levels: number
}): Promise<{
  title: string
  criteria: Array<{
    level: number
    label: string
    canDo: string
    description: string
    score: string
  }>
  teacherNotes: string
}> {
  const gradeLabels: Record<string, string> = {
    middle1: "중학교 1학년", middle2: "중학교 2학년", middle3: "중학교 3학년",
    high1: "고등학교 1학년", high2: "고등학교 2학년", high3: "고등학교 3학년",
  }
  const skillLabels: Record<string, string> = {
    reading: "읽기", writing: "쓰기", listening: "듣기", speaking: "말하기",
  }

  const prompt = `Create a CEFR Can-Do based performance assessment rubric:
- Grade: ${gradeLabels[params.grade] || params.grade}
- Skill: ${skillLabels[params.skill] || params.skill}
- Topic: ${params.topic}
- Target CEFR Level: ${params.cefrTarget}
- Number of levels: ${params.levels}

Based on 2022 개정 교육과정 achievement standards.

Respond in JSON:
{
  "title": "루브릭 제목 (한국어)",
  "criteria": [
    {
      "level": ${params.levels},
      "label": "최상 (Outstanding)",
      "canDo": "CEFR Can-Do 서술문 (한국어)",
      "description": "구체적 수행 기준 (한국어)",
      "score": "95-100"
    },
    ...descending levels...
    {
      "level": 1,
      "label": "기초 (Beginning)",
      "canDo": "CEFR Can-Do 서술문",
      "description": "구체적 수행 기준",
      "score": "0-59"
    }
  ],
  "teacherNotes": "교사 참고 사항 (한국어, 평가 시 유의점 2-3문장)"
}

Return ONLY valid JSON.`

  const text = await callGemini(prompt, TEACHER_SYSTEM)
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error("루브릭 생성 결과를 파싱할 수 없습니다.")
  }
}

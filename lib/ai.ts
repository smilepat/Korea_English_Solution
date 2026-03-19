import Anthropic from "@anthropic-ai/sdk"
import { turso, parseJsonField } from "./turso"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = "claude-sonnet-4-6"
const MAX_TOKENS = 2048

// ============================================================
// 시스템 프롬프트
// ============================================================

const SYSTEM_PROMPT = `당신은 대한민국 영어 교사를 지원하는 AI 코파일럿입니다.
다음 전문 분야를 갖추고 있습니다:
- 2022/2015 개정 영어 교육과정 분석
- Lexile 지수 기반 독해 수준 진단
- 수능 영어 문항 출제 및 분석
- CEFR 기준 영어 능력 평가
- 영어 수업 설계 및 활동 개발

답변 규칙:
1. 항상 한국어로 답변합니다 (영어 전문용어는 병기 가능)
2. 교사에게 실질적으로 도움이 되는 정보를 제공합니다
3. 교육과정 근거를 제시할 때는 출처를 명시합니다
4. 수업 활동 제안 시 실행 가능성을 고려합니다
5. 답변은 명확한 구조(제목, 항목)로 작성합니다`

// ============================================================
// RAG: 지식 DB 키워드 검색 (Phase 1 - Vector 이전 단계)
// ============================================================

export async function searchKnowledge(query: string, limit = 5): Promise<string> {
  try {
    const keywords = query
      .split(/\s+/)
      .filter((k) => k.length > 1)
      .slice(0, 5)

    if (keywords.length === 0) return ""

    const conditions = keywords.map(() => "content LIKE ? OR title LIKE ? OR keywords LIKE ?").join(" OR ")
    const params = keywords.flatMap((k) => [`%${k}%`, `%${k}%`, `%${k}%`])

    const result = await turso.execute({
      sql: `SELECT title, content, type, source, ai_summary
            FROM knowledge_documents
            WHERE ${conditions}
            ORDER BY updated_at DESC
            LIMIT ?`,
      args: [...params, limit],
    })

    if (result.rows.length === 0) return ""

    return result.rows
      .map((row) => {
        const summary = row.ai_summary as string | null
        const content = row.content as string
        const title = row.title as string
        const type = row.type as string
        const source = row.source as string | null
        return `[${type}] ${title}\n${summary || content.slice(0, 300)}\n${source ? `출처: ${source}` : ""}`
      })
      .join("\n\n---\n\n")
  } catch (error) {
    console.error("지식 검색 오류:", error)
    return ""
  }
}

export async function generateAndStoreEmbedding(documentId: number, content: string) {
  try {
    const { generateEmbedding } = await import("./gemini")
    const embedding = await generateEmbedding(content)
    if (embedding.length > 0) {
      const embeddingStr = `[${embedding.join(",")}]`
      await turso.execute({
        sql: "UPDATE knowledge_documents SET embedding = vector32(?) WHERE id = ?",
        args: [embeddingStr, documentId],
      })
    }
  } catch (error) {
    console.error("임베딩 생성 실패:", error)
  }
}

export async function vectorSearch(query: string, limit: number = 5): Promise<string> {
  try {
    const { generateEmbedding } = await import("./gemini")
    const queryEmbedding = await generateEmbedding(query)
    if (queryEmbedding.length === 0) return searchKnowledge(query, limit)

    const embeddingStr = `[${queryEmbedding.join(",")}]`
    const result = await turso.execute({
      sql: `SELECT id, type, title, ai_summary, content,
              vector_distance_cos(embedding, vector32(?)) as distance
            FROM knowledge_documents
            WHERE embedding IS NOT NULL
            ORDER BY distance ASC
            LIMIT ?`,
      args: [embeddingStr, limit],
    })

    if (result.rows.length === 0) return searchKnowledge(query, limit)

    return result.rows
      .map((row) => {
        const summary = row.ai_summary || (typeof row.content === "string" ? row.content.slice(0, 200) : "")
        return `[${row.type}] ${row.title}: ${summary}`
      })
      .join("\n\n")
  } catch (error) {
    console.error("벡터 검색 실패, 키워드 검색으로 전환:", error)
    return searchKnowledge(query, limit)
  }
}

// ============================================================
// RAG: 교육과정 성취기준 검색
// ============================================================

export async function searchCurriculumStandards(grade?: string, skill?: string): Promise<string> {
  try {
    let sql = "SELECT * FROM curriculum_standards WHERE 1=1"
    const args: string[] = []

    if (grade) {
      sql += " AND grade = ?"
      args.push(grade)
    }
    if (skill) {
      sql += " AND skill = ?"
      args.push(skill)
    }
    sql += " ORDER BY curriculum DESC, grade ASC LIMIT 10"

    const result = await turso.execute({ sql, args })

    if (result.rows.length === 0) return ""

    return result.rows
      .map((row) => {
        const curriculum = row.curriculum as string
        const grade = row.grade as string
        const skill = row.skill as string
        const description = row.description as string
        const cefr = row.cefr_level as string | null
        const lexileMin = row.lexile_min as number | null
        const lexileMax = row.lexile_max as number | null
        return `[${curriculum}] ${grade} ${skill}: ${description}${cefr ? ` (CEFR: ${cefr})` : ""}${lexileMin ? ` (Lexile: ${lexileMin}~${lexileMax}L)` : ""}`
      })
      .join("\n")
  } catch (error) {
    console.error("성취기준 검색 오류:", error)
    return ""
  }
}

// ============================================================
// 교육과정 해석 AI
// ============================================================

export async function interpretCurriculum(question: string): Promise<string> {
  let knowledgeContext = ""
  try {
    knowledgeContext = await vectorSearch(question, 5)
  } catch {
    knowledgeContext = await searchKnowledge(question, 5)
  }
  const standardsContext = await searchCurriculumStandards()

  const contextText = [
    knowledgeContext ? `[관련 지식]\n${knowledgeContext}` : "",
    standardsContext ? `[교육과정 성취기준]\n${standardsContext}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: contextText
          ? `다음 참고 자료를 바탕으로 질문에 답해주세요.\n\n${contextText}\n\n질문: ${question}`
          : question,
      },
    ],
  })

  return message.content[0].type === "text" ? message.content[0].text : ""
}

// ============================================================
// 수능 문항 생성 AI
// ============================================================

export async function generateCsatItem(params: {
  type: string
  passage?: string
  topic?: string
  lexileLevel?: number
  difficulty?: string
}): Promise<{
  passage: string
  question: string
  options: string[]
  answer: number
  explanation: string
}> {
  const { type, passage, topic, lexileLevel = 900, difficulty = "medium" } = params

  const difficultyMap: Record<string, string> = {
    easy: "쉬운 (Lexile 700-800L, 일상적 어휘)",
    medium: "중간 (Lexile 850-1000L, 다양한 어휘)",
    hard: "어려운 (Lexile 1000-1200L, 학술적 어휘)",
  }

  const typeGuide: Record<string, string> = {
    빈칸추론: "지문에서 핵심 내용을 담은 빈칸을 만들고, 문맥에 맞는 어구나 문장을 고르는 문항",
    순서배열: "주어진 단락을 논리적 순서에 맞게 배열하는 문항",
    요약완성: "지문의 내용을 요약한 문장의 빈칸을 완성하는 문항",
    심경분위기: "글의 분위기나 필자/등장인물의 심경을 파악하는 문항",
    주제요지: "글의 주제나 요지를 파악하는 문항",
    지칭추론: "밑줄 친 대명사나 표현이 가리키는 것을 추론하는 문항",
    무관한문장: "글의 흐름과 무관한 문장을 찾는 문항",
  }

  const prompt = passage
    ? `다음 영어 지문을 활용하여 수능 스타일의 "${type}" 문항을 생성해주세요.

지문:
${passage}

요구사항:
- 문항 유형: ${type} (${typeGuide[type] || type})
- 난이도: ${difficultyMap[difficulty] || difficulty}
- 목표 Lexile: ${lexileLevel}L
- 선택지 5개 (한국어 또는 영어)
- 정답 번호 명시
- 상세한 풀이 해설 포함`
    : `다음 조건으로 수능 스타일의 "${type}" 문항을 새로 생성해주세요.

조건:
- 주제: ${topic || "일반적인 사회/문화/과학 주제"}
- 문항 유형: ${type} (${typeGuide[type] || type})
- 난이도: ${difficultyMap[difficulty] || difficulty}
- 목표 Lexile: ${lexileLevel}L
- 영어 지문 (5~8문장) 작성
- 선택지 5개
- 정답 번호 명시
- 상세한 풀이 해설 포함`

  const schemaPrompt = `
반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "passage": "영어 지문",
  "question": "문항 질문",
  "options": ["① 선택지1", "② 선택지2", "③ 선택지3", "④ 선택지4", "⑤ 선택지5"],
  "answer": 정답번호(1~5),
  "explanation": "풀이 해설 (한국어)"
}`

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: prompt + schemaPrompt,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("JSON not found")
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      passage: "",
      question: "문항 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
      options: ["① -", "② -", "③ -", "④ -", "⑤ -"],
      answer: 1,
      explanation: text,
    }
  }
}

// ============================================================
// Lexile 결과 → AI 교수 전략
// ============================================================

export async function getLexileTeachingStrategy(params: {
  lexileLevel: string
  language: "ko" | "en"
}): Promise<{
  levelDescription: string
  teachingStrategies: string[]
  recommendedMaterials: string[]
  nextLevelTips: string[]
  studentMessage: string
}> {
  const { lexileLevel, language } = params

  const levelNum = lexileLevel === "BR" ? 0 : parseInt(lexileLevel)

  const prompt = `학생의 Lexile 읽기 레벨이 ${lexileLevel}L입니다.
테스트 언어: ${language === "ko" ? "한국어" : "영어"}

다음 내용을 JSON으로 제공해주세요:
1. 이 레벨의 의미 설명 (2-3문장)
2. 교사를 위한 교수 전략 3가지 (구체적이고 실행 가능한)
3. 이 레벨에 적합한 추천 교재/자료 3가지
4. 다음 레벨(${levelNum + 100}L)로 향상하기 위한 학습 팁 3가지
5. 학생에게 보여줄 격려 메시지 (1-2문장)

JSON 형식:
{
  "levelDescription": "레벨 설명",
  "teachingStrategies": ["전략1", "전략2", "전략3"],
  "recommendedMaterials": ["자료1", "자료2", "자료3"],
  "nextLevelTips": ["팁1", "팁2", "팁3"],
  "studentMessage": "학생 메시지"
}`

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("JSON not found")
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      levelDescription: `Lexile ${lexileLevel} 수준의 독자입니다.`,
      teachingStrategies: ["다양한 수준의 텍스트를 꾸준히 읽습니다.", "어휘 학습을 병행합니다.", "읽기 후 요약 활동을 합니다."],
      recommendedMaterials: ["해당 레벨 영어 원서", "영자 신문 기사", "온라인 읽기 플랫폼"],
      nextLevelTips: ["매일 20분 이상 영어 읽기", "모르는 단어 기록 및 복습", "내용 요약 영작 연습"],
      studentMessage: "꾸준한 읽기 연습으로 실력이 향상되고 있습니다!",
    }
  }
}

// ============================================================
// 지식 문서 AI 처리 (요약 + 교육적 함의 자동 생성)
// ============================================================

export async function processKnowledgeDocument(title: string, content: string): Promise<{
  summary: string
  implications: string
  keywords: string[]
}> {
  const prompt = `다음 영어교육 관련 문서를 분석해주세요.

제목: ${title}
내용: ${content.slice(0, 2000)}

JSON 형식으로 다음을 제공해주세요:
{
  "summary": "3-5문장 핵심 요약",
  "implications": "영어 교사에게 주는 교육적 함의 (2-3가지)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("JSON not found")
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      summary: content.slice(0, 200),
      implications: "교육적 함의를 분석하는 중입니다.",
      keywords: title.split(" ").slice(0, 5),
    }
  }
}

// ============================================================
// 수능 문항 구조 분석 AI
// ============================================================

export async function analyzeCsatItem(passage: string, question: string, options: string[], answer: number, type: string): Promise<{
  passage_metrics: Record<string, unknown>
  coherence_profile: Record<string, unknown>
  abstractness_map: Record<string, unknown>
  vocab_profile: Record<string, unknown>
  structure_analysis: Record<string, unknown>
  skills: Array<Record<string, unknown>>
  distractor_analysis: Array<Record<string, unknown>>
}> {
  const optionsText = options.map((o, i) => `${i + 1}. ${o}`).join("\n")

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `수능 영어 문항을 구조적으로 분석해주세요.

[문항 유형] ${type}
[정답] ${answer}번

[지문]
${passage}

[질문]
${question}

[선택지]
${optionsText}

다음 JSON 형식으로 분석하세요:
{
  "passage_metrics": {
    "word_count": 숫자,
    "sentence_count": 숫자,
    "avg_sentence_length": 숫자,
    "subordinate_clause_ratio": 0~1,
    "passive_voice_ratio": 0~1,
    "text_complexity_score": 0~1,
    "lexile_estimated": 숫자
  },
  "coherence_profile": {
    "surface_level": 0~1,
    "textbase_level": 0~1,
    "situation_model_level": 0~1,
    "connective_density": 0~1,
    "inference_demand": "low|medium|high",
    "gaps": [{"position": "N→N+1", "type": "단절유형", "severity": "low|medium|high"}]
  },
  "abstractness_map": {
    "overall_score": 0~1,
    "sentence_scores": [0~1, ...],
    "pattern": "추상도 변화 패턴",
    "types": {"conceptual": 0~1, "metaphorical": 0~1, "philosophical": 0~1}
  },
  "vocab_profile": {
    "elementary_ratio": 0~1,
    "intermediate_ratio": 0~1,
    "advanced_ratio": 0~1,
    "academic_word_ratio": 0~1,
    "type_token_ratio": 0~1
  },
  "structure_analysis": {
    "name": "글의 구조명",
    "pattern": ["단계1", "단계2", ...],
    "category": "논증형|설명형|서사형|비교대조형"
  },
  "skills": [
    {"name": "능력명", "importance": "primary|secondary", "bloom_level": "기억|이해|적용|분석|평가|창조"}
  ],
  "distractor_analysis": [
    {"option_number": 숫자, "type": "오답유형명", "reason": "오답 이유"}
  ]
}

JSON만 반환하세요.`
    }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(cleaned)
}

// ============================================================
// 수능 문항 난이도 예측 AI
// ============================================================

export async function predictDifficulty(analysis: {
  passage_metrics: Record<string, unknown>
  coherence_profile: Record<string, unknown>
  abstractness_map: Record<string, unknown>
  vocab_profile: Record<string, unknown>
  structure_analysis: Record<string, unknown>
}, type: string): Promise<{ predicted_answer_rate: number; reasoning: string }> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `수능 영어 ${type} 유형 문항의 난이도를 예측하세요.

분석 데이터:
${JSON.stringify(analysis, null, 2)}

난이도 예측 공식 (가중치):
- 종속절 비율 (w=0.35): 높을수록 어려움
- 응집성 textbase (w=0.25): 낮을수록 어려움
- 추상도 (w=0.25): 높을수록 어려움
- 고급어휘 비율 (w=0.12): 높을수록 어려움
- 문맥단서 (w=-0.20): 많을수록 쉬움
- 평균 문장 길이 (w=0.03): 길수록 어려움

JSON으로 응답하세요:
{
  "predicted_answer_rate": 0~100 사이 정수 (예측 정답률),
  "reasoning": "예측 근거 설명 (한국어 2-3문장)"
}

JSON만 반환하세요.`
    }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(cleaned)
}

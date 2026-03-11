"use server"

import { interpretCurriculum, searchKnowledge } from "@/lib/ai"
import { turso } from "@/lib/turso"
import { searchKnowledgeDocuments } from "./knowledge"

// ============================================================
// 교육과정 해석 AI
// ============================================================

export async function askCurriculumAI(
  question: string,
  sessionId: string,
): Promise<{ success: boolean; answer?: string; error?: string }> {
  try {
    const answer = await interpretCurriculum(question)

    // 대화 이력 저장
    await saveSession(sessionId, "curriculum", [
      { role: "user" as const, content: question },
      { role: "assistant" as const, content: answer },
    ])

    return { success: true, answer }
  } catch (error) {
    console.error("교육과정 AI 오류:", error)
    return { success: false, error: "AI 응답 생성 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 지식 통합 검색 (AI 요약 포함)
// ============================================================

export async function searchWithAI(query: string): Promise<{
  success: boolean
  documents?: Array<{
    id: number
    type: string
    title: string
    ai_summary?: string
    source?: string
  }>
  aiAnswer?: string
  error?: string
}> {
  try {
    const [documents, aiContext] = await Promise.all([
      searchKnowledgeDocuments(query),
      searchKnowledge(query, 5),
    ])

    let aiAnswer: string | undefined

    if (aiContext) {
      const { anthropic } = await import("@/lib/ai")
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `다음 자료를 바탕으로 "${query}"에 대해 영어 교사에게 도움이 되는 핵심 답변을 2-3문장으로 작성해주세요.\n\n${aiContext}`,
          },
        ],
      })
      aiAnswer = message.content[0].type === "text" ? message.content[0].text : undefined
    }

    return {
      success: true,
      documents: documents.map((d) => ({
        id: d.id,
        type: d.type,
        title: d.title,
        ai_summary: d.ai_summary,
        source: d.source,
      })),
      aiAnswer,
    }
  } catch (error) {
    console.error("AI 검색 오류:", error)
    return { success: false, error: "검색 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 세션 저장
// ============================================================

async function saveSession(
  sessionId: string,
  feature: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<void> {
  try {
    const existing = await turso.execute({
      sql: "SELECT id, messages FROM teacher_sessions WHERE session_id = ? AND feature = ?",
      args: [sessionId, feature],
    })

    if (existing.rows.length > 0) {
      const existingMessages = JSON.parse((existing.rows[0].messages as string) || "[]")
      const updatedMessages = [...existingMessages, ...messages]
      await turso.execute({
        sql: "UPDATE teacher_sessions SET messages = ? WHERE id = ?",
        args: [JSON.stringify(updatedMessages), existing.rows[0].id as number],
      })
    } else {
      await turso.execute({
        sql: "INSERT INTO teacher_sessions (session_id, feature, messages) VALUES (?, ?, ?)",
        args: [sessionId, feature, JSON.stringify(messages)],
      })
    }
  } catch (error) {
    console.error("세션 저장 오류:", error)
  }
}

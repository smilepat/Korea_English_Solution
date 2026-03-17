"use server"

import { turso } from "@/lib/turso"
import { callGemini, continueConversation, evaluateConversation } from "@/lib/gemini"

// ============================================================
// 대화 시작 - 초기 AI 인사 메시지 생성
// ============================================================

export async function startConversationAction(params: {
  scenario: string
  cefrLevel: string
}): Promise<{ success: boolean; greeting?: string; error?: string }> {
  try {
    const prompt = `You are an English conversation partner for a Korean student.
Start a conversation for this scenario: "${params.scenario}"
Student's CEFR Level: ${params.cefrLevel}

Generate a natural, friendly opening line in English appropriate for ${params.cefrLevel} level.
The greeting should set the scene for the scenario and invite the student to respond.
Return ONLY the greeting message text, nothing else.`

    const systemInstruction = `당신은 대한민국 영어교사를 지원하는 AI 어시스턴트입니다.
학생의 CEFR 레벨에 맞는 자연스러운 영어 대화를 이끌어주세요.`

    const greeting = await callGemini(prompt, systemInstruction)
    return { success: true, greeting: greeting.trim() }
  } catch (error) {
    console.error("대화 시작 오류:", error)
    return { success: false, error: "대화를 시작하는 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 메시지 전송 - 학생 입력에 대한 AI 응답 + 피드백
// ============================================================

export async function sendMessage(params: {
  scenario: string
  cefrLevel: string
  messages: Array<{ role: "student" | "ai"; content: string }>
  studentInput: string
}): Promise<{
  success: boolean
  response?: string
  feedback?: { corrections: string[]; suggestions: string[]; encouragement: string }
  error?: string
}> {
  try {
    const result = await continueConversation({
      scenario: params.scenario,
      cefrLevel: params.cefrLevel,
      messages: params.messages,
      studentInput: params.studentInput,
    })

    return {
      success: true,
      response: result.response,
      feedback: result.feedback,
    }
  } catch (error) {
    console.error("메시지 전송 오류:", error)
    return { success: false, error: "AI 응답을 생성하는 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 대화 종료 - 전체 평가 + DB 저장
// ============================================================

export async function endConversation(params: {
  scenario: string
  cefrLevel: string
  messages: Array<{ role: "student" | "ai"; content: string }>
}): Promise<{
  success: boolean
  evaluation?: {
    fluency: number
    accuracy: number
    vocabulary: number
    taskCompletion: number
    overall: string
    strengths: string[]
    improvements: string[]
  }
  error?: string
}> {
  try {
    const evaluation = await evaluateConversation({
      scenario: params.scenario,
      cefrLevel: params.cefrLevel,
      messages: params.messages,
    })

    // DB에 세션 저장
    await turso.execute({
      sql: `INSERT INTO conversation_sessions (scenario, cefr_level, messages, fluency, accuracy, vocabulary, task_completion, overall, strengths, improvements, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        params.scenario,
        params.cefrLevel,
        JSON.stringify(params.messages),
        evaluation.fluency,
        evaluation.accuracy,
        evaluation.vocabulary,
        evaluation.taskCompletion,
        evaluation.overall,
        JSON.stringify(evaluation.strengths),
        JSON.stringify(evaluation.improvements),
      ],
    })

    return { success: true, evaluation }
  } catch (error) {
    console.error("대화 종료 오류:", error)
    return { success: false, error: "대화 평가 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 대화 기록 조회
// ============================================================

export async function getConversationHistory(): Promise<{
  success: boolean
  sessions?: Array<{
    id: number
    scenario: string
    cefrLevel: string
    fluency: number
    accuracy: number
    vocabulary: number
    taskCompletion: number
    createdAt: string
  }>
  error?: string
}> {
  try {
    const result = await turso.execute({
      sql: `SELECT id, scenario, cefr_level, fluency, accuracy, vocabulary, task_completion, created_at
            FROM conversation_sessions
            ORDER BY created_at DESC
            LIMIT 5`,
      args: [],
    })

    const sessions = result.rows.map((row) => ({
      id: row.id as number,
      scenario: row.scenario as string,
      cefrLevel: row.cefr_level as string,
      fluency: row.fluency as number,
      accuracy: row.accuracy as number,
      vocabulary: row.vocabulary as number,
      taskCompletion: row.task_completion as number,
      createdAt: row.created_at as string,
    }))

    return { success: true, sessions }
  } catch (error) {
    console.error("대화 기록 조회 오류:", error)
    return { success: false, error: "대화 기록을 불러오는 중 오류가 발생했습니다." }
  }
}

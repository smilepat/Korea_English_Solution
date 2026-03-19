"use server"

import { turso, type LessonCase } from "@/lib/turso"
import { anthropic } from "@/lib/ai"

// ============================================================
// 수업 설계 AI 생성
// ============================================================

export async function generateLessonPlan(params: {
  grade: string
  skill: string
  topic: string
  duration: string
  lexileRange?: string
  model?: string
}): Promise<{ success: boolean; lesson?: LessonCase; error?: string }> {
  try {
    const { grade, skill, topic, duration, lexileRange } = params

    const gradeMap: Record<string, string> = {
      middle1: "중학교 1학년",
      middle2: "중학교 2학년",
      middle3: "중학교 3학년",
      high1: "고등학교 1학년",
      high2: "고등학교 2학년",
      high3: "고등학교 3학년",
    }
    const skillMap: Record<string, string> = {
      reading: "읽기",
      writing: "쓰기",
      listening: "듣기",
      speaking: "말하기",
    }

    const prompt = `${gradeMap[grade] || grade} 영어 ${skillMap[skill] || skill} 수업을 설계해주세요.

주제: ${topic}
수업 시간: ${duration}
${lexileRange ? `학생 Lexile 범위: ${lexileRange}L` : ""}

다음 JSON 형식으로 수업 지도안을 작성해주세요:
{
  "objectives": "수업 목표 (2022 개정 교육과정 성취기준 연계, 2-3가지)",
  "activity": "수업 활동 단계\\n도입(10분): ...\\n전개(30분): ...\\n정리(5분): ...",
  "material": "필요한 교재·자료 목록 (3-4가지)",
  "lexile_range": "권장 텍스트 Lexile 범위 (예: 700-900)",
  "outcome": "기대 학습 성과",
  "teacher_notes": "교사 참고사항 및 유의점"
}`

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : "{}"
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("JSON 파싱 실패")

    const generated = JSON.parse(jsonMatch[0])

    const result = await turso.execute({
      sql: `INSERT INTO lesson_cases (grade, skill, topic, objectives, activity, material, lexile_range, duration, outcome, teacher_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        grade,
        skill,
        topic,
        generated.objectives ?? null,
        generated.activity ?? null,
        generated.material ?? null,
        generated.lexile_range ?? lexileRange ?? null,
        duration,
        generated.outcome ?? null,
        generated.teacher_notes ?? null,
      ],
    })

    const id = Number(result.lastInsertRowid)

    return {
      success: true,
      lesson: {
        id,
        grade,
        skill,
        topic,
        objectives: generated.objectives,
        activity: generated.activity,
        material: generated.material,
        lexile_range: generated.lexile_range ?? lexileRange,
        duration,
        outcome: generated.outcome,
        teacher_notes: generated.teacher_notes,
        created_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("수업 설계 생성 오류:", error)
    return { success: false, error: "수업 설계 생성 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 수업 사례 목록 조회
// ============================================================

export async function getLessonCases(params?: {
  grade?: string
  skill?: string
  limit?: number
}): Promise<LessonCase[]> {
  try {
    let sql = "SELECT * FROM lesson_cases WHERE 1=1"
    const args: (string | number)[] = []

    if (params?.grade) {
      sql += " AND grade = ?"
      args.push(params.grade)
    }
    if (params?.skill) {
      sql += " AND skill = ?"
      args.push(params.skill)
    }

    sql += " ORDER BY created_at DESC LIMIT ?"
    args.push(params?.limit ?? 20)

    const result = await turso.execute({ sql, args })

    return result.rows.map((row) => ({
      id: row.id as number,
      grade: row.grade as string,
      skill: row.skill as string,
      topic: row.topic as string,
      objectives: (row.objectives as string) || undefined,
      activity: (row.activity as string) || undefined,
      material: (row.material as string) || undefined,
      lexile_range: (row.lexile_range as string) || undefined,
      duration: (row.duration as string) || undefined,
      outcome: (row.outcome as string) || undefined,
      teacher_notes: (row.teacher_notes as string) || undefined,
      created_at: row.created_at as string,
    }))
  } catch (error) {
    console.error("수업 사례 조회 오류:", error)
    return []
  }
}

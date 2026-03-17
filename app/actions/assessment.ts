"use server"

import { turso } from "@/lib/turso"
import { generateRubric } from "@/lib/gemini"

// ============================================================
// 루브릭 생성 (AI)
// ============================================================

export async function generateRubricAction(params: {
  grade: string
  skill: string
  topic: string
  cefrTarget: string
  levels: number
}): Promise<{
  success: boolean
  rubric?: {
    id: number
    title: string
    grade: string
    skill: string
    topic: string
    cefrTarget: string
    levels: number
    criteria: Array<{
      level: number
      label: string
      canDo: string
      description: string
      score: string
    }>
    teacherNotes: string
    created_at: string
  }
  error?: string
}> {
  try {
    const { grade, skill, topic, cefrTarget, levels } = params

    const generated = await generateRubric({ grade, skill, topic, cefrTarget, levels })

    const result = await turso.execute({
      sql: `INSERT INTO rubrics (title, grade, skill, topic, cefr_target, levels, criteria, teacher_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        generated.title,
        grade,
        skill,
        topic,
        cefrTarget,
        levels,
        JSON.stringify(generated.criteria),
        generated.teacherNotes,
      ],
    })

    const id = Number(result.lastInsertRowid)

    return {
      success: true,
      rubric: {
        id,
        title: generated.title,
        grade,
        skill,
        topic,
        cefrTarget,
        levels,
        criteria: generated.criteria,
        teacherNotes: generated.teacherNotes,
        created_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("루브릭 생성 오류:", error)
    return { success: false, error: "루브릭 생성 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 저장된 루브릭 조회
// ============================================================

export interface SavedRubric {
  id: number
  title: string
  grade: string
  skill: string
  topic: string
  cefrTarget: string
  levels: number
  criteria: Array<{
    level: number
    label: string
    canDo: string
    description: string
    score: string
  }>
  teacherNotes: string
  created_at: string
}

export async function getRubrics(params?: {
  grade?: string
  skill?: string
}): Promise<SavedRubric[]> {
  try {
    let sql = "SELECT * FROM rubrics WHERE 1=1"
    const args: (string | number)[] = []

    if (params?.grade) {
      sql += " AND grade = ?"
      args.push(params.grade)
    }
    if (params?.skill) {
      sql += " AND skill = ?"
      args.push(params.skill)
    }

    sql += " ORDER BY created_at DESC LIMIT 50"

    const result = await turso.execute({ sql, args })

    return result.rows.map((row) => {
      let criteria = []
      try {
        criteria = JSON.parse((row.criteria as string) || "[]")
      } catch {
        criteria = []
      }

      return {
        id: row.id as number,
        title: row.title as string,
        grade: row.grade as string,
        skill: row.skill as string,
        topic: row.topic as string,
        cefrTarget: row.cefr_target as string,
        levels: row.levels as number,
        criteria,
        teacherNotes: (row.teacher_notes as string) || "",
        created_at: row.created_at as string,
      }
    })
  } catch (error) {
    console.error("루브릭 조회 오류:", error)
    return []
  }
}

// ============================================================
// 루브릭 삭제
// ============================================================

export async function deleteRubric(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await turso.execute({
      sql: "DELETE FROM rubrics WHERE id = ?",
      args: [id],
    })
    return { success: true }
  } catch (error) {
    console.error("루브릭 삭제 오류:", error)
    return { success: false, error: "루브릭 삭제 중 오류가 발생했습니다." }
  }
}

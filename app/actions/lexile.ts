"use server"

import { turso } from "@/lib/turso"
import { ulid } from "@/lib/kes-ids"

export interface LexileTestResult {
  id: string
  user_id: string | null // = kes_students.id (레거시 필드명 유지)
  score: number | null
  level: string | null
  test_date: string
  answers: any | null
}

/**
 * Lexile 테스트 결과 저장.
 *
 * studentId 를 주면 원본 기록과 함께 진단 스냅샷으로도 승격된다
 * (= /student-tracker 의 Lexile 추이에 즉시 반영). 주지 않으면 원본만
 * 남고 어느 학생에게도 귀속되지 않는다 — 기존에 user_id 가 항상 null 로
 * 저장되어 결과가 전부 고아가 되던 버그를 이렇게 닫는다.
 * 학생 컨텍스트를 실제로 붙이는 것은 Phase 2(/s/[classCode]) 작업이다.
 */
export async function saveLexileTestResult(
  score: number,
  level: string,
  answers: any,
  studentId?: string,
): Promise<{ success: boolean; data?: LexileTestResult; error?: string }> {
  try {
    const id = ulid()
    const answersJson = JSON.stringify(answers ?? null)

    const statements: Array<{ sql: string; args: unknown[] }> = [
      {
        sql: `INSERT INTO kes_lexile_results (id, student_id, score, level, answers)
              VALUES (?, ?, ?, ?, ?)`,
        args: [id, studentId ?? null, score, level, answersJson],
      },
    ]

    if (studentId) {
      statements.push({
        sql: `INSERT INTO kes_diagnosis_snapshots
                (id, student_id, kind, scale, value_num, value_text, detail, source)
              VALUES (?, ?, 'lexile', 'lexile', ?, ?, ?, 'in-app-lexile')`,
        args: [
          ulid(),
          studentId,
          score,
          level,
          JSON.stringify({ result_id: id, answers: answers ?? null }),
        ],
      })
    }

    await turso.batch(statements as never[])

    const row = await turso.execute({
      sql: "SELECT test_date FROM kes_lexile_results WHERE id = ?",
      args: [id],
    })
    const testDate = String(row.rows[0]?.test_date ?? new Date().toISOString())

    return {
      success: true,
      data: {
        id,
        user_id: studentId ?? null,
        score,
        level,
        test_date: testDate,
        answers,
      },
    }
  } catch (error) {
    console.error("Error in saveLexileTestResult:", error)
    return { success: false, error: "Failed to save test result" }
  }
}

export async function getLexileTestResults(
  studentId?: string,
): Promise<LexileTestResult[]> {
  try {
    const r = studentId
      ? await turso.execute({
          sql: `SELECT id, student_id, score, level, test_date, answers
                FROM kes_lexile_results WHERE student_id = ? ORDER BY test_date DESC`,
          args: [studentId],
        })
      : await turso.execute(
          `SELECT id, student_id, score, level, test_date, answers
           FROM kes_lexile_results ORDER BY test_date DESC`,
        )

    return r.rows.map((row) => {
      let answers: any = null
      if (row.answers) {
        try {
          answers = JSON.parse(String(row.answers))
        } catch {
          answers = null
        }
      }
      return {
        id: String(row.id),
        user_id: row.student_id ? String(row.student_id) : null,
        score: row.score === null ? null : Number(row.score),
        level: row.level === null ? null : String(row.level),
        test_date: String(row.test_date ?? ""),
        answers,
      }
    })
  } catch (error) {
    console.error("Error in getLexileTestResults:", error)
    return []
  }
}

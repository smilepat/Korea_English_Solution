"use server"

import { turso } from "@/lib/turso"
import { normalizeCode } from "@/lib/kes-ids"

// ============================================================
// 학생 진입 — 반 코드로 명부를 열고, 학생이 자기 이름을 고르거나
// 조인 토큰으로 자신을 확정한다.
//
// 신원은 교사가 소유한 명부에서만 해석된다. 학생이 입력한 값으로 새 학생을
// 만들지 않는다(자유 닉네임 금지). 감독 하의 교실 진단이므로 "이름 탭"을
// 기본 흐름으로 두고, 조인 토큰을 정확 확정 수단으로 함께 제공한다.
// ============================================================

export interface ClassPeek {
  found: boolean
  classId?: string
  className?: string
  gradeBand?: string
  gradeLabel?: string
  // 명부(이름 탭 UI). 토큰·학번 같은 민감정보는 내려보내지 않는다.
  students?: Array<{ id: string; name: string; seatNo: number | null }>
}

/**
 * 반 코드로 명부를 연다.
 * 이름 목록만 반환한다(토큰 미포함). 반 코드는 교사가 교실에 띄우는 값이므로
 * 그 반 학생 이름이 노출되는 것은 감독 교실 맥락에서 허용 범위다.
 */
export async function peekClass(classCodeRaw: string): Promise<ClassPeek> {
  const classCode = normalizeCode(classCodeRaw)
  if (classCode.length !== 6) return { found: false }

  try {
    const cls = await turso.execute({
      sql: `SELECT id, name, grade_band, grade_label
            FROM kes_classes WHERE class_code = ? AND archived = 0`,
      args: [classCode],
    })
    if (cls.rows.length === 0) return { found: false }
    const c = cls.rows[0]

    const students = await turso.execute({
      sql: `SELECT s.id, s.display_name, e.seat_no
            FROM kes_students s
            JOIN kes_enrollments e ON e.student_id = s.id
            WHERE e.class_id = ? AND e.active = 1
            ORDER BY e.seat_no, s.display_name`,
      args: [String(c.id)],
    })

    return {
      found: true,
      classId: String(c.id),
      className: String(c.name ?? ""),
      gradeBand: String(c.grade_band ?? ""),
      gradeLabel: String(c.grade_label ?? ""),
      students: students.rows.map((r) => ({
        id: String(r.id),
        name: String(r.display_name ?? ""),
        seatNo: r.seat_no === null ? null : Number(r.seat_no),
      })),
    }
  } catch (error) {
    console.error("Error in peekClass:", error)
    return { found: false }
  }
}

export interface ResolvedStudent {
  ok: boolean
  studentId?: string
  studentName?: string
  error?: string
}

/**
 * 학생이 명부에서 이름을 탭해 자신을 확정한다.
 * studentId 가 실제로 그 반에 속하는지 서버에서 재확인한다(클라이언트 신뢰 금지).
 */
export async function resolveStudentByPick(params: {
  classCode: string
  studentId: string
}): Promise<ResolvedStudent> {
  const classCode = normalizeCode(params.classCode)
  try {
    const r = await turso.execute({
      sql: `SELECT s.id, s.display_name
            FROM kes_students s
            JOIN kes_enrollments e ON e.student_id = s.id
            JOIN kes_classes c     ON c.id = e.class_id
            WHERE c.class_code = ? AND s.id = ? AND e.active = 1 AND c.archived = 0`,
      args: [classCode, params.studentId],
    })
    if (r.rows.length === 0) {
      return { ok: false, error: "이 반의 명부에서 찾을 수 없습니다." }
    }
    return {
      ok: true,
      studentId: String(r.rows[0].id),
      studentName: String(r.rows[0].display_name ?? ""),
    }
  } catch (error) {
    console.error("Error in resolveStudentByPick:", error)
    return { ok: false, error: "확인 중 오류가 발생했습니다." }
  }
}

/**
 * 조인 토큰으로 자신을 확정한다(이름이 겹치거나 프라이버시가 필요할 때).
 * 반 코드 + 토큰이 같은 학생을 가리켜야 한다.
 */
export async function resolveStudentByToken(params: {
  classCode: string
  joinToken: string
}): Promise<ResolvedStudent> {
  const classCode = normalizeCode(params.classCode)
  const token = normalizeCode(params.joinToken)
  if (token.length !== 6) return { ok: false, error: "토큰은 6자입니다." }
  try {
    const r = await turso.execute({
      sql: `SELECT s.id, s.display_name
            FROM kes_students s
            JOIN kes_enrollments e ON e.student_id = s.id
            JOIN kes_classes c     ON c.id = e.class_id
            WHERE c.class_code = ? AND s.join_token = ? AND e.active = 1 AND c.archived = 0`,
      args: [classCode, token],
    })
    if (r.rows.length === 0) {
      return { ok: false, error: "반 코드와 토큰이 맞지 않습니다. 카드를 확인하세요." }
    }
    return {
      ok: true,
      studentId: String(r.rows[0].id),
      studentName: String(r.rows[0].display_name ?? ""),
    }
  } catch (error) {
    console.error("Error in resolveStudentByToken:", error)
    return { ok: false, error: "확인 중 오류가 발생했습니다." }
  }
}

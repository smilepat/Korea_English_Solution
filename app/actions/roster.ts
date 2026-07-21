"use server"

import { turso } from "@/lib/turso"
import { ulid, generateUniqueCode, humanCode } from "@/lib/kes-ids"
import { parseRosterCsv, type RosterRow } from "@/lib/roster-csv"

// ============================================================
// 명부 관리 — 반 생성 + CSV 일괄 등록 + 조인 카드 데이터
//
// 학생 신원은 교사가 소유한다(명부 우선). 학생이 자유 입력한 이름으로
// 행을 만들지 않는다. 각 학생은 종이 카드에 인쇄될 6자 조인 토큰을 갖는다.
// ============================================================

export interface JoinCard {
  studentId: string
  name: string
  studentNumber: string
  seatNo: number | null
  joinToken: string
}

export interface ClassRoster {
  classId: string
  className: string
  gradeBand: string
  gradeLabel: string
  classCode: string
  schoolYear: number
  students: JoinCard[]
}

async function classCodeExists(code: string): Promise<boolean> {
  const r = await turso.execute({
    sql: "SELECT 1 FROM kes_classes WHERE class_code = ? LIMIT 1",
    args: [code],
  })
  return r.rows.length > 0
}

async function joinTokenExists(token: string): Promise<boolean> {
  const r = await turso.execute({
    sql: "SELECT 1 FROM kes_students WHERE join_token = ? LIMIT 1",
    args: [token],
  })
  return r.rows.length > 0
}

/**
 * CSV 로 반 하나를 통째로 등록한다.
 * CSV 헤더: name(또는 이름), number(또는 학번/출석번호) — 순서 무관, 별칭 허용.
 *
 * grade_band 는 반 단위로 교사가 지정한다(초·중·고 전부 가르치므로 기본값 없음).
 * 파싱 실패 행은 건너뛰지 않고 통째로 실패시킨다 — 30명 중 3명이 조용히
 * 누락되는 것이 가장 나쁜 실패 모드이므로.
 */
export async function importRosterCsv(params: {
  className: string
  gradeBand: string
  gradeLabel?: string
  classNum?: string
  schoolYear?: number
  csvText: string
}): Promise<{ success: boolean; classId?: string; classCode?: string; count?: number; error?: string }> {
  let rows: RosterRow[]
  try {
    rows = parseRosterCsv(params.csvText)
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "CSV 파싱 실패" }
  }
  if (rows.length === 0) {
    return { success: false, error: "CSV 에 학생 행이 없습니다. (헤더: name, number)" }
  }

  try {
    const classId = ulid()
    const classCode = await generateUniqueCode(classCodeExists)

    const statements: Array<{ sql: string; args: unknown[] }> = [
      {
        sql: `INSERT INTO kes_classes
                (id, name, grade_band, grade_label, class_num, class_code, school_year)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          classId,
          params.className,
          params.gradeBand,
          params.gradeLabel ?? null,
          params.classNum ?? null,
          classCode,
          params.schoolYear ?? new Date().getFullYear(),
        ],
      },
    ]

    // 토큰은 배치 실행 전에 미리 유니크하게 확보한다(같은 배치 내 충돌 방지).
    const usedTokens = new Set<string>()
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const studentId = ulid()
      let token = await generateUniqueCode(async (c) =>
        usedTokens.has(c) || (await joinTokenExists(c)),
      )
      usedTokens.add(token)

      statements.push({
        sql: `INSERT INTO kes_students (id, display_name, student_number, join_token)
              VALUES (?, ?, ?, ?)`,
        args: [studentId, row.name, row.number ?? null, token],
      })
      statements.push({
        sql: `INSERT INTO kes_enrollments (class_id, student_id, seat_no, active)
              VALUES (?, ?, ?, 1)`,
        args: [classId, studentId, row.seatNo ?? i + 1],
      })
    }

    await turso.batch(statements as never[])
    return { success: true, classId, classCode, count: rows.length }
  } catch (error) {
    console.error("Error in importRosterCsv:", error)
    return { success: false, error: "명부 등록에 실패했습니다." }
  }
}

// ============================================================
// 진단 현황 보드 — 수업 중 교사가 보는 "누가 봤고 누가 안 봤나"
// ============================================================

export interface StudentDiagnosisRow {
  studentId: string
  name: string
  seatNo: number | null
  // 최신 어휘 CAT
  vocabTheta: number | null
  vocabCefr: string | null
  vocabAt: string | null
  // 최신 Lexile
  lexile: number | null
  lexileText: string | null
  lexileAt: string | null
  tested: boolean // 둘 중 하나라도 봤는가
}

export interface ClassDiagnosisBoard {
  classId: string
  className: string
  total: number
  testedCount: number
  rows: StudentDiagnosisRow[]
  // 간단 분포(테스트한 학생 기준)
  cefrDistribution: Record<string, number>
}

/**
 * 반의 진단 현황. 학생별 최신 vocab_cat / lexile 스냅샷 + 미응시 플래그.
 * "아직 안 본 학생"이 한눈에 보이는 것이 수업 중 실제로 쓰는 뷰다.
 */
export async function getClassDiagnosisBoard(
  classId: string,
): Promise<ClassDiagnosisBoard | null> {
  try {
    const cls = await turso.execute({
      sql: "SELECT id, name FROM kes_classes WHERE id = ?",
      args: [classId],
    })
    if (cls.rows.length === 0) return null

    const students = await turso.execute({
      sql: `SELECT s.id, s.display_name, e.seat_no
            FROM kes_students s
            JOIN kes_enrollments e ON e.student_id = s.id
            WHERE e.class_id = ? AND e.active = 1
            ORDER BY e.seat_no, s.display_name`,
      args: [classId],
    })
    if (students.rows.length === 0) {
      return {
        classId,
        className: String(cls.rows[0].name ?? ""),
        total: 0,
        testedCount: 0,
        rows: [],
        cefrDistribution: {},
      }
    }

    const ids = students.rows.map((r) => String(r.id))
    const ph = ids.map(() => "?").join(",")

    // (학생, kind) 최신 1건씩
    const snaps = await turso.execute({
      sql: `SELECT student_id, kind, value_num, value_text, taken_at
            FROM (
              SELECT student_id, kind, value_num, value_text, taken_at,
                     ROW_NUMBER() OVER (
                       PARTITION BY student_id, kind ORDER BY taken_at DESC
                     ) rn
              FROM kes_diagnosis_snapshots
              WHERE student_id IN (${ph}) AND kind IN ('vocab_cat','lexile')
            ) WHERE rn = 1`,
      args: ids as never[],
    })

    const byStudent = new Map<string, { vocab?: any; lexile?: any }>()
    for (const r of snaps.rows) {
      const sid = String(r.student_id)
      const cur = byStudent.get(sid) ?? {}
      if (String(r.kind) === "vocab_cat") cur.vocab = r
      else if (String(r.kind) === "lexile") cur.lexile = r
      byStudent.set(sid, cur)
    }

    const cefrDistribution: Record<string, number> = {}
    let testedCount = 0

    const rows: StudentDiagnosisRow[] = students.rows.map((s) => {
      const sid = String(s.id)
      const snap = byStudent.get(sid) ?? {}
      const vocabCefr = snap.vocab ? String(snap.vocab.value_text ?? "") || null : null
      const tested = Boolean(snap.vocab || snap.lexile)
      if (tested) testedCount++
      if (vocabCefr) cefrDistribution[vocabCefr] = (cefrDistribution[vocabCefr] ?? 0) + 1

      return {
        studentId: sid,
        name: String(s.display_name ?? ""),
        seatNo: s.seat_no === null ? null : Number(s.seat_no),
        vocabTheta: snap.vocab?.value_num != null ? Number(snap.vocab.value_num) : null,
        vocabCefr,
        vocabAt: snap.vocab ? String(snap.vocab.taken_at ?? "").slice(0, 10) : null,
        lexile: snap.lexile?.value_num != null ? Number(snap.lexile.value_num) : null,
        lexileText: snap.lexile ? String(snap.lexile.value_text ?? "") || null : null,
        lexileAt: snap.lexile ? String(snap.lexile.taken_at ?? "").slice(0, 10) : null,
        tested,
      }
    })

    return {
      classId,
      className: String(cls.rows[0].name ?? ""),
      total: rows.length,
      testedCount,
      rows,
      cefrDistribution,
    }
  } catch (error) {
    console.error("Error in getClassDiagnosisBoard:", error)
    return null
  }
}

/** 반 하나의 조인 카드 데이터(인쇄용). */
export async function getClassRoster(classId: string): Promise<ClassRoster | null> {
  try {
    const cls = await turso.execute({
      sql: `SELECT id, name, grade_band, grade_label, class_code, school_year
            FROM kes_classes WHERE id = ?`,
      args: [classId],
    })
    if (cls.rows.length === 0) return null
    const c = cls.rows[0]

    const students = await turso.execute({
      sql: `SELECT s.id, s.display_name, s.student_number, s.join_token, e.seat_no
            FROM kes_students s
            JOIN kes_enrollments e ON e.student_id = s.id
            WHERE e.class_id = ? AND e.active = 1
            ORDER BY e.seat_no, s.display_name`,
      args: [classId],
    })

    return {
      classId: String(c.id),
      className: String(c.name ?? ""),
      gradeBand: String(c.grade_band ?? ""),
      gradeLabel: String(c.grade_label ?? ""),
      classCode: String(c.class_code ?? ""),
      schoolYear: Number(c.school_year ?? 0),
      students: students.rows.map((r) => ({
        studentId: String(r.id),
        name: String(r.display_name ?? ""),
        studentNumber: String(r.student_number ?? ""),
        seatNo: r.seat_no === null ? null : Number(r.seat_no),
        joinToken: String(r.join_token ?? ""),
      })),
    }
  } catch (error) {
    console.error("Error in getClassRoster:", error)
    return null
  }
}

/** 학생 조인 토큰 회전(카드 분실·유출 시). */
export async function rotateJoinToken(
  studentId: string,
): Promise<{ success: boolean; joinToken?: string; error?: string }> {
  try {
    const token = await generateUniqueCode(joinTokenExists)
    await turso.execute({
      sql: "UPDATE kes_students SET join_token = ? WHERE id = ?",
      args: [token, studentId],
    })
    return { success: true, joinToken: token }
  } catch (error) {
    console.error("Error in rotateJoinToken:", error)
    return { success: false, error: "토큰 회전에 실패했습니다." }
  }
}

/** 명부에 학생 한 명을 수동 추가(CSV 없이). */
export async function addStudentToClass(params: {
  classId: string
  name: string
  studentNumber?: string
  seatNo?: number
}): Promise<{ success: boolean; joinToken?: string; error?: string }> {
  try {
    const studentId = ulid()
    const token = await generateUniqueCode(joinTokenExists)
    await turso.batch([
      {
        sql: `INSERT INTO kes_students (id, display_name, student_number, join_token)
              VALUES (?, ?, ?, ?)`,
        args: [studentId, params.name, params.studentNumber ?? null, token],
      },
      {
        sql: `INSERT INTO kes_enrollments (class_id, student_id, seat_no, active)
              VALUES (?, ?, ?, 1)`,
        args: [params.classId, studentId, params.seatNo ?? null],
      },
    ])
    return { success: true, joinToken: token }
  } catch (error) {
    console.error("Error in addStudentToClass:", error)
    return { success: false, error: "학생 추가에 실패했습니다." }
  }
}

/** 미리보기용 샘플 조인 토큰(실제 저장 없이 UI 데모). */
export async function previewToken(): Promise<string> {
  return humanCode()
}

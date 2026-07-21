"use server"

import { turso } from "@/lib/turso"
import { ulid, generateUniqueCode } from "@/lib/kes-ids"
import { callGemini, parseGeminiJson } from "@/lib/gemini"

// ============================================================
// Types
//
// Student 는 정규화된 kes_* 테이블에서 조립되는 "뷰"다.
// 기존 페이지(/student-tracker)가 그대로 동작하도록 모양을 유지한다:
//  - grade / classNum  ← kes_classes
//  - lexile_level      ← 최신 lexile 스냅샷
//  - lexile_history    ← 전체 lexile 스냅샷
//  - skills            ← dimension 별 최신 skill_cefr 스냅샷
// 즉 이 값들은 저장되는 게 아니라 측정 원장에서 파생된다.
// ============================================================

export interface Student {
  id: string
  name: string
  grade: string
  classNum: string
  lexile_level: number
  skills: {
    reading: string
    writing: string
    listening: string
    speaking: string
  }
  lexile_history: Array<{ date: string; level: number }>
}

export interface Prescription {
  activities: Array<{ title: string; description: string }>
  materials: Array<{ title: string; description: string }>
  goals: Array<{ title: string; description: string }>
}

export interface ClassReport {
  analysis: string
  groups: Array<{
    name: string
    students: string[]
    strategy: string
  }>
}

const EMPTY_SKILLS = { reading: "", writing: "", listening: "", speaking: "" }

/** '중2' / '고1' / '초5' → grade_band. 초·중·고를 전부 가르치므로 기본값을 두지 않는다. */
function inferGradeBand(grade: string): string {
  const g = grade.trim()
  if (/^초|elementary|^E/i.test(g)) return "elementary"
  if (/^중|middle|^M/i.test(g)) return "middle"
  if (/^고|high|^H/i.test(g)) return "high"
  // 숫자만 들어온 경우(예: '2') 는 판정 불가 — 미상으로 남기고 교사가 반 편집에서 고른다
  return "unknown"
}

// ============================================================
// 반 (Class)
// ============================================================

async function classCodeExists(code: string): Promise<boolean> {
  const r = await turso.execute({
    sql: "SELECT 1 FROM kes_classes WHERE class_code = ? LIMIT 1",
    args: [code],
  })
  return r.rows.length > 0
}

/**
 * (grade, classNum) 조합에 해당하는 반을 찾고, 없으면 만든다.
 * 기존 addStudent 시그니처를 유지하기 위한 다리. 새 명부 UI 는 createClass 를 직접 쓴다.
 */
async function resolveOrCreateClass(grade: string, classNum: string): Promise<string> {
  const year = new Date().getFullYear()
  const found = await turso.execute({
    sql: `SELECT id FROM kes_classes
          WHERE grade_label = ? AND COALESCE(class_num,'') = ? AND school_year = ? AND archived = 0
          LIMIT 1`,
    args: [grade, classNum ?? "", year],
  })
  if (found.rows.length > 0) return String(found.rows[0].id)

  const id = ulid()
  const code = await generateUniqueCode(classCodeExists)
  await turso.execute({
    sql: `INSERT INTO kes_classes (id, name, grade_band, grade_label, class_num, class_code, school_year)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      classNum ? `${grade} ${classNum}반` : grade,
      inferGradeBand(grade),
      grade,
      classNum ?? "",
      code,
      year,
    ],
  })
  return id
}

export async function createClass(params: {
  name: string
  gradeBand: string
  gradeLabel?: string
  classNum?: string
  schoolYear?: number
}): Promise<{ success: boolean; id?: string; classCode?: string; error?: string }> {
  try {
    const id = ulid()
    const code = await generateUniqueCode(classCodeExists)
    await turso.execute({
      sql: `INSERT INTO kes_classes (id, name, grade_band, grade_label, class_num, class_code, school_year)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        params.name,
        params.gradeBand,
        params.gradeLabel ?? null,
        params.classNum ?? null,
        code,
        params.schoolYear ?? new Date().getFullYear(),
      ],
    })
    return { success: true, id, classCode: code }
  } catch (error) {
    console.error("Error in createClass:", error)
    return { success: false, error: "반 생성에 실패했습니다." }
  }
}

export async function getClasses(): Promise<
  Array<{
    id: string
    name: string
    gradeBand: string
    gradeLabel: string
    classNum: string
    classCode: string
    schoolYear: number
    studentCount: number
  }>
> {
  try {
    const r = await turso.execute(`
      SELECT c.id, c.name, c.grade_band, c.grade_label, c.class_num,
             c.class_code, c.school_year,
             COUNT(e.student_id) AS student_count
      FROM kes_classes c
      LEFT JOIN kes_enrollments e ON e.class_id = c.id AND e.active = 1
      WHERE c.archived = 0
      GROUP BY c.id
      ORDER BY c.school_year DESC, c.grade_band, c.name
    `)
    return r.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      gradeBand: String(row.grade_band ?? ""),
      gradeLabel: String(row.grade_label ?? ""),
      classNum: String(row.class_num ?? ""),
      classCode: String(row.class_code ?? ""),
      schoolYear: Number(row.school_year ?? 0),
      studentCount: Number(row.student_count ?? 0),
    }))
  } catch (error) {
    console.error("Error in getClasses:", error)
    return []
  }
}

// ============================================================
// 학생 CRUD
// ============================================================

async function joinTokenExists(token: string): Promise<boolean> {
  const r = await turso.execute({
    sql: "SELECT 1 FROM kes_students WHERE join_token = ? LIMIT 1",
    args: [token],
  })
  return r.rows.length > 0
}

export async function addStudent(params: {
  name: string
  grade: string
  classNum: string
  studentNumber?: string
  seatNo?: number
}): Promise<{ success: boolean; id?: string; joinToken?: string; error?: string }> {
  try {
    const classId = await resolveOrCreateClass(params.grade, params.classNum)
    const id = ulid()
    const token = await generateUniqueCode(joinTokenExists)

    await turso.batch([
      {
        sql: `INSERT INTO kes_students (id, display_name, student_number, join_token)
              VALUES (?, ?, ?, ?)`,
        args: [id, params.name, params.studentNumber ?? null, token],
      },
      {
        sql: `INSERT INTO kes_enrollments (class_id, student_id, seat_no, active)
              VALUES (?, ?, ?, 1)`,
        args: [classId, id, params.seatNo ?? null],
      },
    ])
    return { success: true, id, joinToken: token }
  } catch (error) {
    console.error("Error in addStudent:", error)
    return { success: false, error: "학생 추가에 실패했습니다." }
  }
}

export async function getStudents(params?: {
  grade?: string
  classNum?: string
  classId?: string
}): Promise<Student[]> {
  try {
    // --- 1) 학생 + 반 (N+1 방지: 이후 스냅샷은 2번의 일괄 조회로 처리) ---
    const where: string[] = ["e.active = 1", "c.archived = 0"]
    const args: unknown[] = []
    if (params?.classId) {
      where.push("c.id = ?")
      args.push(params.classId)
    }
    if (params?.grade) {
      where.push("c.grade_label = ?")
      args.push(params.grade)
    }
    if (params?.classNum) {
      where.push("COALESCE(c.class_num,'') = ?")
      args.push(params.classNum)
    }

    const base = await turso.execute({
      sql: `SELECT s.id, s.display_name, c.grade_label, c.class_num
            FROM kes_students s
            JOIN kes_enrollments e ON e.student_id = s.id
            JOIN kes_classes c     ON c.id = e.class_id
            WHERE ${where.join(" AND ")}
            ORDER BY c.name, e.seat_no, s.display_name`,
      args: args as never[],
    })

    if (base.rows.length === 0) return []
    const ids = base.rows.map((r) => String(r.id))
    const placeholders = ids.map(() => "?").join(",")

    // --- 2) Lexile 이력 (전체) ---
    const lexRows = await turso.execute({
      sql: `SELECT student_id, value_num, taken_at
            FROM kes_diagnosis_snapshots
            WHERE kind = 'lexile' AND student_id IN (${placeholders})
            ORDER BY taken_at ASC`,
      args: ids as never[],
    })
    const lexHistory = new Map<string, Array<{ date: string; level: number }>>()
    for (const row of lexRows.rows) {
      const sid = String(row.student_id)
      const list = lexHistory.get(sid) ?? []
      list.push({
        date: String(row.taken_at ?? "").slice(0, 10),
        level: Number(row.value_num ?? 0),
      })
      lexHistory.set(sid, list)
    }

    // --- 3) 기능별 CEFR: (학생, dimension) 조합의 최신 1건 ---
    const skillRows = await turso.execute({
      sql: `SELECT student_id, dimension, value_text
            FROM (
              SELECT student_id, dimension, value_text,
                     ROW_NUMBER() OVER (
                       PARTITION BY student_id, dimension ORDER BY taken_at DESC
                     ) AS rn
              FROM kes_diagnosis_snapshots
              WHERE kind = 'skill_cefr' AND student_id IN (${placeholders})
            )
            WHERE rn = 1`,
      args: ids as never[],
    })
    const skillMap = new Map<string, Record<string, string>>()
    for (const row of skillRows.rows) {
      const sid = String(row.student_id)
      const dim = String(row.dimension ?? "")
      if (!dim) continue
      const cur = skillMap.get(sid) ?? {}
      cur[dim] = String(row.value_text ?? "")
      skillMap.set(sid, cur)
    }

    return base.rows.map((row) => {
      const id = String(row.id)
      const history = lexHistory.get(id) ?? []
      return {
        id,
        name: String(row.display_name ?? ""),
        grade: String(row.grade_label ?? ""),
        classNum: String(row.class_num ?? ""),
        // 현재 수준은 저장값이 아니라 최신 측정에서 파생된다
        lexile_level: history.length > 0 ? history[history.length - 1].level : 0,
        skills: { ...EMPTY_SKILLS, ...(skillMap.get(id) ?? {}) },
        lexile_history: history,
      }
    })
  } catch (error) {
    console.error("Error in getStudents:", error)
    return []
  }
}

/**
 * Lexile 측정 기록. UPDATE 가 아니라 INSERT 다 — 원장은 append-only이고
 * "현재 수준"은 최신 행에서 파생된다.
 */
export async function updateStudentLexile(
  studentId: string,
  lexileLevel: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await turso.execute({
      sql: `INSERT INTO kes_diagnosis_snapshots
              (id, student_id, kind, scale, value_num, source)
            VALUES (?, ?, 'lexile', 'lexile', ?, 'teacher-manual')`,
      args: [ulid(), studentId, lexileLevel],
    })
    return { success: true }
  } catch (error) {
    console.error("Error in updateStudentLexile:", error)
    return { success: false, error: "Lexile 수준 업데이트에 실패했습니다." }
  }
}

export async function updateStudentSkill(
  studentId: string,
  skill: string,
  cefrLevel: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await turso.execute({
      sql: `INSERT INTO kes_diagnosis_snapshots
              (id, student_id, kind, dimension, scale, value_text, source)
            VALUES (?, ?, 'skill_cefr', ?, 'cefr', ?, 'teacher-manual')`,
      args: [ulid(), studentId, skill, cefrLevel],
    })
    return { success: true }
  } catch (error) {
    console.error("Error in updateStudentSkill:", error)
    return { success: false, error: "기능 수준 업데이트에 실패했습니다." }
  }
}

export async function deleteStudent(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // ON DELETE CASCADE 가 enrollments/snapshots 를 정리한다.
    // (libSQL 은 기본적으로 FK 를 강제하지 않을 수 있어 명시적으로 지운다)
    await turso.batch([
      { sql: "DELETE FROM kes_diagnosis_snapshots WHERE student_id = ?", args: [id] },
      { sql: "DELETE FROM kes_enrollments WHERE student_id = ?", args: [id] },
      { sql: "DELETE FROM kes_students WHERE id = ?", args: [id] },
    ])
    return { success: true }
  } catch (error) {
    console.error("Error in deleteStudent:", error)
    return { success: false, error: "학생 삭제에 실패했습니다." }
  }
}

// ============================================================
// AI – 개인 학습 처방
// ============================================================

const TEACHER_SYSTEM = `당신은 대한민국 영어교사를 지원하는 AI 어시스턴트입니다.
모든 응답은 한국어로 작성하되, 영어 교육 자료 생성 시에는 영어를 사용합니다.
2022 개정 교육과정, CEFR, Lexile 프레임워크에 대한 전문 지식을 갖추고 있습니다.`

export async function generateStudentPrescription(params: {
  name: string
  lexileLevel: number
  lexileHistory: Array<{ date: string; level: number }>
  skills: Record<string, string>
  studentId?: string // 있으면 실제 과제 시도 데이터를 처방에 반영
}): Promise<{ success: boolean; data?: Prescription; error?: string }> {
  try {
    const historyStr = params.lexileHistory
      .map((h) => `${h.date}: ${h.level}L`)
      .join(", ")

    const skillsStr = Object.entries(params.skills)
      .map(([k, v]) => `${k}: ${v || "미측정"}`)
      .join(", ")

    // 실제 과제 수행 데이터 주입(감이 아니라 시도 기록에서 처방)
    let attemptStr = ""
    if (params.studentId) {
      try {
        const { getStudentAttemptSummary } = await import("@/app/actions/assignments")
        const s = await getStudentAttemptSummary(params.studentId)
        if (s.gradedAttempts > 0) {
          const acc = s.accuracy != null ? Math.round(s.accuracy * 100) : null
          const recent = s.recentCompleted
            .map((r) => `${r.title}(${r.score != null ? Math.round(r.score * 100) + "점" : "미채점"})`)
            .join(", ")
          attemptStr = `\n실제 과제 수행: 채점 문항 ${s.gradedAttempts}개, 정답률 ${acc}%\n최근 완료 과제: ${recent || "없음"}`
        }
      } catch {
        /* 시도 데이터가 없어도 처방은 진행 */
      }
    }

    const prompt = `학생 "${params.name}"에 대한 맞춤형 영어 학습 처방을 생성해주세요.

현재 Lexile 수준: ${params.lexileLevel}L
Lexile 변화 이력: ${historyStr || "없음"}
기능별 CEFR 수준: ${skillsStr}${attemptStr}

다음 JSON 형식으로 응답해주세요:
{
  "activities": [
    {"title": "활동 제목", "description": "구체적인 활동 설명 (2-3문장)"},
    {"title": "활동 제목", "description": "구체적인 활동 설명"},
    {"title": "활동 제목", "description": "구체적인 활동 설명"}
  ],
  "materials": [
    {"title": "교재/자료 제목", "description": "추천 이유와 활용 방법"},
    {"title": "교재/자료 제목", "description": "추천 이유와 활용 방법"},
    {"title": "교재/자료 제목", "description": "추천 이유와 활용 방법"}
  ],
  "goals": [
    {"title": "학습 목표", "description": "달성 기준과 기간"},
    {"title": "학습 목표", "description": "달성 기준과 기간"},
    {"title": "학습 목표", "description": "달성 기준과 기간"}
  ]
}

각 카테고리별 3개씩 추천해주세요. 학생의 현재 수준과 이력을 고려한 구체적이고 실현 가능한 처방을 작성해주세요.
Return ONLY valid JSON, no markdown formatting.`

    const text = await callGemini(prompt, TEACHER_SYSTEM, { json: true })
    const data = parseGeminiJson<Prescription>(text)
    return { success: true, data }
  } catch (error) {
    console.error("Error in generateStudentPrescription:", error)
    return { success: false, error: "AI 학습 처방 생성에 실패했습니다." }
  }
}

// ============================================================
// AI – 학급 리포트
// ============================================================

export async function generateClassReport(
  students: Array<{
    name: string
    lexileLevel: number
    skills: Record<string, string>
  }>,
): Promise<{ success: boolean; data?: ClassReport; error?: string }> {
  try {
    const studentInfo = students
      .map((s) => {
        const skills = Object.entries(s.skills)
          .map(([k, v]) => `${k}:${v || "미측정"}`)
          .join(", ")
        return `- ${s.name}: Lexile ${s.lexileLevel}L, ${skills}`
      })
      .join("\n")

    const prompt = `다음 학급 학생들의 영어 수준 데이터를 분석하여 학급 리포트를 생성해주세요.

학생 데이터:
${studentInfo}

다음 JSON 형식으로 응답해주세요:
{
  "analysis": "학급 전체 분석 (3-5문장, 평균 수준, 분포 특성, 주요 관찰 사항 포함)",
  "groups": [
    {
      "name": "그룹명 (예: 상위 그룹)",
      "students": ["학생1", "학생2"],
      "strategy": "이 그룹에 적합한 교수전략 (2-3문장)"
    },
    {
      "name": "그룹명 (예: 중위 그룹)",
      "students": ["학생3", "학생4"],
      "strategy": "이 그룹에 적합한 교수전략"
    },
    {
      "name": "그룹명 (예: 기초 그룹)",
      "students": ["학생5", "학생6"],
      "strategy": "이 그룹에 적합한 교수전략"
    }
  ]
}

수준별로 2-4개 그룹으로 나누고, 각 그룹에 맞는 구체적인 교수전략을 제시해주세요.
Return ONLY valid JSON, no markdown formatting.`

    const text = await callGemini(prompt, TEACHER_SYSTEM, { json: true })
    const data = parseGeminiJson<ClassReport>(text)
    return { success: true, data }
  } catch (error) {
    console.error("Error in generateClassReport:", error)
    return { success: false, error: "AI 학급 리포트 생성에 실패했습니다." }
  }
}

"use server"

import { turso } from "@/lib/turso"
import { ulid } from "@/lib/kes-ids"
import { queryWordlist, saveWorksheet } from "@/app/actions/content"
import { lexileToCefr } from "@/lib/lexile-window"

// ============================================================
// 과제/처방 루프 — 배정 → 학생 풀이 → 채점 → 완료
//
// 채점은 서버가 한다. payload 는 정답을 포함하지만 학생 브라우저에는 보기만
// 내려간다(CAT 프록시와 동일 철학). 시도는 append-only.
// ============================================================

interface WorksheetItem {
  type: "mcq" | "short"
  question: string
  options?: string[]
  answer?: number | string
}

// ── 배정 ────────────────────────────────────────────────────
/**
 * 저장된 워크시트/단어장을 반 또는 개인에게 배정한다.
 * payload 에 콘텐츠 스냅샷을 넣어 이후 원본이 바뀌어도 과제는 고정된다.
 * 대상 학생마다 assignment_status 행을 미리 만들어 "누가 안 했나"를 즉시 조회 가능.
 */
export async function createAssignment(params: {
  classId?: string // 없고 studentId 만 있으면 학생의 반에서 도출
  studentId?: string // 없으면 반 전체
  worksheetId: string
  origin?: string
  dueAt?: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    // classId 도출: 개인 처방 배정 시 학생의 (활성) 반을 찾는다
    let classId = params.classId
    if (!classId && params.studentId) {
      const cls = await turso.execute({
        sql: `SELECT class_id FROM kes_enrollments
              WHERE student_id = ? AND active = 1 LIMIT 1`,
        args: [params.studentId],
      })
      if (cls.rows.length > 0) classId = String(cls.rows[0].class_id)
    }
    if (!classId) return { ok: false, error: "반을 특정할 수 없습니다." }

    const ws = await turso.execute({
      sql: `SELECT id, title, kind, spec FROM kes_worksheets WHERE id = ?`,
      args: [params.worksheetId],
    })
    if (ws.rows.length === 0) return { ok: false, error: "워크시트를 찾을 수 없습니다." }
    const w = ws.rows[0]
    const kind = String(w.kind)
    let spec: any = {}
    try {
      spec = JSON.parse(String(w.spec))
    } catch {
      spec = {}
    }

    // 워크시트면 지문 본문도 스냅샷에 포함(학생이 읽어야 하므로)
    let passageBody: string | null = null
    let passageTopic: string | null = null
    if (kind === "worksheet" && spec.passageId) {
      const p = await turso.execute({
        sql: `SELECT topic, text_body FROM kes_passages WHERE text_id = ?`,
        args: [spec.passageId],
      })
      if (p.rows.length > 0) {
        passageTopic = String(p.rows[0].topic ?? "")
        passageBody = String(p.rows[0].text_body ?? "")
      }
    }

    const payload = {
      kind,
      title: String(w.title),
      passageId: spec.passageId ?? null,
      passageTopic,
      passageBody,
      items: (spec.items ?? []) as WorksheetItem[],
      words: spec.words ?? null, // 단어장
    }

    const id = ulid()
    const statements: Array<{ sql: string; args: unknown[] }> = [
      {
        sql: `INSERT INTO kes_assignments
                (id, class_id, student_id, kind, ref_id, title, payload, origin, due_at)
              VALUES (?,?,?,?,?,?,?,?,?)`,
        args: [
          id,
          classId,
          params.studentId ?? null,
          kind,
          params.worksheetId,
          String(w.title),
          JSON.stringify(payload),
          params.origin ?? "manual",
          params.dueAt ?? null,
        ],
      },
    ]

    // 대상 학생 목록 → status 행 생성
    let targets: string[] = []
    if (params.studentId) {
      targets = [params.studentId]
    } else {
      const roster = await turso.execute({
        sql: `SELECT student_id FROM kes_enrollments WHERE class_id = ? AND active = 1`,
        args: [classId],
      })
      targets = roster.rows.map((r) => String(r.student_id))
    }
    for (const sid of targets) {
      statements.push({
        sql: `INSERT OR IGNORE INTO kes_assignment_status (assignment_id, student_id, status)
              VALUES (?, ?, 'assigned')`,
        args: [id, sid],
      })
    }

    await turso.batch(statements as never[])
    return { ok: true, id }
  } catch (error) {
    console.error("Error in createAssignment:", error)
    return { ok: false, error: "배정에 실패했습니다." }
  }
}

// ── 학생: 내 과제 ──────────────────────────────────────────
export interface StudentAssignment {
  id: string
  title: string
  kind: string
  status: string
  itemCount: number
  assignedAt: string
}

export async function getStudentAssignments(
  studentId: string,
): Promise<StudentAssignment[]> {
  try {
    // 이 학생 개인 과제 + 이 학생이 속한 반의 전체 과제
    const r = await turso.execute({
      sql: `SELECT a.id, a.title, a.kind, a.payload, a.assigned_at,
                   COALESCE(st.status, 'assigned') AS status
            FROM kes_assignments a
            JOIN kes_enrollments e ON e.class_id = a.class_id AND e.student_id = ?
            LEFT JOIN kes_assignment_status st
                   ON st.assignment_id = a.id AND st.student_id = ?
            WHERE a.archived = 0 AND (a.student_id IS NULL OR a.student_id = ?)
            ORDER BY a.assigned_at DESC
            LIMIT 50`,
      args: [studentId, studentId, studentId],
    })
    return r.rows.map((row) => {
      let items = 0
      try {
        items = (JSON.parse(String(row.payload)).items ?? []).length
      } catch {
        items = 0
      }
      return {
        id: String(row.id),
        title: String(row.title ?? ""),
        kind: String(row.kind ?? ""),
        status: String(row.status ?? "assigned"),
        itemCount: items,
        assignedAt: String(row.assigned_at ?? ""),
      }
    })
  } catch (error) {
    console.error("Error in getStudentAssignments:", error)
    return []
  }
}

// ── 학생: 과제 열기 (정답 제거) ────────────────────────────
export interface AssignmentView {
  id: string
  title: string
  kind: string
  passageTopic: string | null
  passageBody: string | null
  items: Array<{ type: string; question: string; options?: string[] }>
  words: any
  status: string
}

export async function openAssignment(params: {
  assignmentId: string
  studentId: string
}): Promise<{ ok: boolean; view?: AssignmentView; error?: string }> {
  try {
    const r = await turso.execute({
      sql: `SELECT a.id, a.title, a.kind, a.payload,
                   COALESCE(st.status,'assigned') status
            FROM kes_assignments a
            LEFT JOIN kes_assignment_status st
                   ON st.assignment_id = a.id AND st.student_id = ?
            WHERE a.id = ?`,
      args: [params.studentId, params.assignmentId],
    })
    if (r.rows.length === 0) return { ok: false, error: "과제를 찾을 수 없습니다." }
    const row = r.rows[0]
    const payload = JSON.parse(String(row.payload))

    // 열람 시 started 로 표시(assigned 였다면)
    await turso.execute({
      sql: `INSERT INTO kes_assignment_status (assignment_id, student_id, status)
            VALUES (?, ?, 'started')
            ON CONFLICT(assignment_id, student_id)
            DO UPDATE SET status = CASE WHEN kes_assignment_status.status = 'assigned'
                                        THEN 'started' ELSE kes_assignment_status.status END,
                          updated_at = datetime('now')`,
      args: [params.assignmentId, params.studentId],
    })

    return {
      ok: true,
      view: {
        id: String(row.id),
        title: String(row.title ?? ""),
        kind: String(row.kind ?? ""),
        passageTopic: payload.passageTopic ?? null,
        passageBody: payload.passageBody ?? null,
        // ★ 정답(answer) 제거 후 전달
        items: (payload.items ?? []).map((it: WorksheetItem) => ({
          type: it.type,
          question: it.question,
          options: it.options,
        })),
        words: payload.words ?? null,
        status: String(row.status ?? "assigned"),
      },
    }
  } catch (error) {
    console.error("Error in openAssignment:", error)
    return { ok: false, error: "과제 열기에 실패했습니다." }
  }
}

// ── 학생: 문항 시도(서버 채점) ─────────────────────────────
/**
 * chosenIndex 는 options 배열 인덱스. 서버가 payload 의 정답과 대조해 채점한다.
 * 서술형(short)은 채점하지 않고 응답만 기록(correct=NULL).
 */
export async function recordAttempt(params: {
  assignmentId: string
  studentId: string
  itemIndex: number
  chosenIndex?: number
  textResponse?: string
  timeMs?: number
}): Promise<{ ok: boolean; correct?: boolean | null; error?: string }> {
  try {
    const r = await turso.execute({
      sql: `SELECT payload FROM kes_assignments WHERE id = ?`,
      args: [params.assignmentId],
    })
    if (r.rows.length === 0) return { ok: false, error: "과제를 찾을 수 없습니다." }
    const payload = JSON.parse(String(r.rows[0].payload))
    const item: WorksheetItem | undefined = payload.items?.[params.itemIndex]
    if (!item) return { ok: false, error: "문항을 찾을 수 없습니다." }

    let correct: boolean | null = null
    let response: string | null = null
    if (item.type === "mcq" && typeof params.chosenIndex === "number") {
      correct = params.chosenIndex === Number(item.answer)
      response = item.options?.[params.chosenIndex] ?? String(params.chosenIndex)
    } else {
      response = params.textResponse ?? null // 서술형: 채점 안 함
    }

    await turso.execute({
      sql: `INSERT INTO kes_attempts
              (id, assignment_id, student_id, item_index, correct, response, time_ms)
            VALUES (?,?,?,?,?,?,?)`,
      args: [
        ulid(),
        params.assignmentId,
        params.studentId,
        params.itemIndex,
        correct === null ? null : correct ? 1 : 0,
        response,
        params.timeMs ?? null,
      ],
    })
    return { ok: true, correct }
  } catch (error) {
    console.error("Error in recordAttempt:", error)
    return { ok: false, error: "제출에 실패했습니다." }
  }
}

// ── 학생: 과제 완료 ────────────────────────────────────────
export async function completeAssignment(params: {
  assignmentId: string
  studentId: string
}): Promise<{ ok: boolean; score?: number | null; error?: string }> {
  try {
    // 채점 가능한 시도(correct NOT NULL)로 점수 계산
    const agg = await turso.execute({
      sql: `SELECT COUNT(*) total, SUM(correct) got
            FROM kes_attempts
            WHERE assignment_id = ? AND student_id = ? AND correct IS NOT NULL`,
      args: [params.assignmentId, params.studentId],
    })
    const total = Number(agg.rows[0].total ?? 0)
    const got = Number(agg.rows[0].got ?? 0)
    const score = total > 0 ? got / total : null

    await turso.execute({
      sql: `INSERT INTO kes_assignment_status
              (assignment_id, student_id, status, score, completed_at)
            VALUES (?, ?, 'completed', ?, datetime('now'))
            ON CONFLICT(assignment_id, student_id)
            DO UPDATE SET status='completed', score=excluded.score,
                          completed_at=datetime('now'), updated_at=datetime('now')`,
      args: [params.assignmentId, params.studentId, score],
    })
    return { ok: true, score }
  } catch (error) {
    console.error("Error in completeAssignment:", error)
    return { ok: false, error: "완료 처리에 실패했습니다." }
  }
}

// ── 교사: 과제 현황 보드 ───────────────────────────────────
export interface AssignmentBoardRow {
  id: string
  title: string
  kind: string
  assignedAt: string
  total: number
  completed: number
  avgScore: number | null
}

export async function getClassAssignments(
  classId: string,
): Promise<AssignmentBoardRow[]> {
  try {
    const r = await turso.execute({
      sql: `SELECT a.id, a.title, a.kind, a.assigned_at,
                   COUNT(st.student_id) total,
                   SUM(CASE WHEN st.status='completed' THEN 1 ELSE 0 END) completed,
                   AVG(CASE WHEN st.status='completed' THEN st.score END) avg_score
            FROM kes_assignments a
            LEFT JOIN kes_assignment_status st ON st.assignment_id = a.id
            WHERE a.class_id = ? AND a.archived = 0
            GROUP BY a.id
            ORDER BY a.assigned_at DESC
            LIMIT 50`,
      args: [classId],
    })
    return r.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      kind: String(row.kind ?? ""),
      assignedAt: String(row.assigned_at ?? ""),
      total: Number(row.total ?? 0),
      completed: Number(row.completed ?? 0),
      avgScore: row.avg_score == null ? null : Number(row.avg_score),
    }))
  } catch (error) {
    console.error("Error in getClassAssignments:", error)
    return []
  }
}

// ── 처방 → 과제 원클릭 (진단→개입 루프의 마지막 연결) ──────
/**
 * 학생 진단 수준에 맞춘 교육과정 단어장을 생성해 그 학생에게 바로 배정한다.
 * origin='recommendation' 으로 처방 유래를 추적한다.
 * cefr 를 주면 그 수준, 없으면 lexile 에서 추정한다.
 */
export async function prescribeWordlistAssignment(params: {
  studentId: string
  studentName: string
  cefr?: string
  lexile?: number
  count?: number
}): Promise<{ ok: boolean; assignmentId?: string; cefr?: string; wordCount?: number; error?: string }> {
  try {
    const cefr = params.cefr || lexileToCefr(params.lexile) || "A2"
    const limit = Math.min(params.count ?? 15, 40)

    // 학생 수준의 교육과정 어휘를 뽑는다
    const words = await queryWordlist({ cefr: [cefr], curriculumOnly: true, limit })
    if (words.length === 0) {
      return { ok: false, error: `${cefr} 수준 교육과정 어휘를 찾지 못했습니다.` }
    }

    // 단어장으로 저장(provenance = original)
    const saved = await saveWorksheet({
      title: `${params.studentName} 맞춤 단어장 (${cefr})`,
      kind: "wordlist",
      spec: { words: words.map((w) => w.word), items: words },
      provenance: [
        { source: "vocab-graph-db@efl-data-hub", license: "original" },
        { source: "vocab-context", license: "original" },
      ],
    })
    if (!saved.ok || !saved.id) return { ok: false, error: saved.error ?? "단어장 저장 실패" }

    // 그 학생에게 배정(classId 는 학생 반에서 도출)
    const asg = await createAssignment({
      studentId: params.studentId,
      worksheetId: saved.id,
      origin: "recommendation:cefr-wordlist",
    })
    if (!asg.ok) return { ok: false, error: asg.error }

    return { ok: true, assignmentId: asg.id, cefr, wordCount: words.length }
  } catch (error) {
    console.error("Error in prescribeWordlistAssignment:", error)
    return { ok: false, error: "맞춤 과제 배정에 실패했습니다." }
  }
}

// ── 처방용: 학생 시도 집계 ─────────────────────────────────
export interface AttemptSummary {
  totalAttempts: number
  gradedAttempts: number
  accuracy: number | null
  recentCompleted: Array<{ title: string; score: number | null; at: string }>
}

/** 학생의 최근 시도 통계 — AI 처방 프롬프트에 주입한다. */
export async function getStudentAttemptSummary(
  studentId: string,
): Promise<AttemptSummary> {
  try {
    const agg = await turso.execute({
      sql: `SELECT COUNT(*) total,
                   SUM(CASE WHEN correct IS NOT NULL THEN 1 ELSE 0 END) graded,
                   AVG(CASE WHEN correct IS NOT NULL THEN correct END) acc
            FROM kes_attempts WHERE student_id = ?`,
      args: [studentId],
    })
    const recent = await turso.execute({
      sql: `SELECT a.title, st.score, st.completed_at
            FROM kes_assignment_status st
            JOIN kes_assignments a ON a.id = st.assignment_id
            WHERE st.student_id = ? AND st.status = 'completed'
            ORDER BY st.completed_at DESC LIMIT 5`,
      args: [studentId],
    })
    return {
      totalAttempts: Number(agg.rows[0].total ?? 0),
      gradedAttempts: Number(agg.rows[0].graded ?? 0),
      accuracy: agg.rows[0].acc == null ? null : Number(agg.rows[0].acc),
      recentCompleted: recent.rows.map((r) => ({
        title: String(r.title ?? ""),
        score: r.score == null ? null : Number(r.score),
        at: String(r.completed_at ?? "").slice(0, 10),
      })),
    }
  } catch (error) {
    console.error("Error in getStudentAttemptSummary:", error)
    return { totalAttempts: 0, gradedAttempts: 0, accuracy: null, recentCompleted: [] }
  }
}

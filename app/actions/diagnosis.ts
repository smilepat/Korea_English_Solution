"use server"

import { turso } from "@/lib/turso"
import { ulid } from "@/lib/kes-ids"

// ============================================================
// 진단 프록시 — 어휘 CAT(Cloud Run) 중계 + 진단 스냅샷 저장
//
// 설계 핵심:
//  - Cloud Run 은 문항과 함께 correct_answer 를 돌려준다. 우리는 그것을
//    kes_cat_sessions 에 서버 측으로만 보관하고, 학생 브라우저에는 보기(options)만
//    내려보낸다. 학생이 고른 보기를 서버가 correct_answer 와 대조해 is_correct 를
//    계산한 뒤 Cloud Run 에 전달한다. → 정답이 클라이언트로 새지 않는다.
//  - Cloud Run 은 학생 신원을 모른다. 익명 능력추정만 오간다. 학생-세션 매핑은
//    우리 프록시(kes_cat_sessions)가 쥔다.
// ============================================================

const API_BASE =
  process.env.VOCAB_CAT_API_URL?.trim() ||
  "https://vocab-cat-api-452237528328.asia-northeast3.run.app"

const START_TIMEOUT_MS = 30_000 // Cloud Run 콜드스타트 대비
const STEP_TIMEOUT_MS = 20_000

/** kes grade_band + grade_label → CAT API 학년 enum. */
function toCatGrade(gradeBand: string, gradeLabel: string): string {
  const label = (gradeLabel || "").replace(/\s/g, "")
  // 라벨 우선 매핑
  const map: Record<string, string> = {
    초3: "초3-4", 초4: "초3-4", "초3-4": "초3-4",
    초5: "초5-6", 초6: "초5-6", "초5-6": "초5-6",
    중1: "중1", 중2: "중2", 중3: "중3",
    고1: "고1", 고2: "고2", 고3: "고3",
  }
  if (map[label]) return map[label]
  // 라벨이 모호하면 학교급 기본값
  if (gradeBand === "elementary") return "초5-6"
  if (gradeBand === "high") return "고1"
  return "중2"
}

/** 학생에게 안전하게 내려보낼 문항(정답·오답 제거). */
interface SafeItem {
  itemId: number
  word: string
  stem: string | null
  options: string[]
  pos: string
  cefr: string
}

function stripItem(item: any): SafeItem {
  return {
    itemId: item.item_id,
    word: item.word,
    stem: item.stem ?? null,
    options: Array.isArray(item.options) ? item.options : [],
    pos: item.pos ?? "",
    cefr: item.cefr ?? "",
  }
}

/** 서버 측 보관용(정답 포함). */
function pendingFromItem(item: any) {
  return {
    item_id: item.item_id,
    word: item.word,
    correct_answer: item.correct_answer ?? null,
    options: Array.isArray(item.options) ? item.options : [],
  }
}

async function catFetch(path: string, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: ctrl.signal })
    if (!res.ok) throw new Error(`CAT API ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

export interface CatStep {
  sessionId: string
  complete: boolean
  item: SafeItem | null
  itemsDone: number
  theta: number
  // 완료 시에만 채워진다
  result?: {
    theta: number
    se: number
    cefr: string
    vocabSize: number
    curriculumLevel: string
    accuracy: number
    totalItems: number
  }
}

/** CAT 시작. 학생별 세션을 열고 첫 문항(정답 제거)을 반환한다. */
export async function startVocabCat(params: {
  studentId: string
  gradeBand: string
  gradeLabel: string
}): Promise<{ ok: boolean; step?: CatStep; error?: string }> {
  try {
    const grade = toCatGrade(params.gradeBand, params.gradeLabel)
    const data = await catFetch(
      "/api/v1/test/start",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          self_assess: "intermediate",
          exam_experience: "none",
          question_type: 0, // 혼합(추천)
        }),
      },
      START_TIMEOUT_MS,
    )

    await turso.execute({
      sql: `INSERT INTO kes_cat_sessions
              (session_id, student_id, remote_user_id, grade, status, current_item,
               items_done, current_theta)
            VALUES (?, ?, ?, ?, 'active', ?, 0, ?)`,
      args: [
        data.session_id,
        params.studentId,
        data.user_id ?? null,
        grade,
        JSON.stringify(pendingFromItem(data.first_item)),
        data.initial_theta ?? null,
      ],
    })

    return {
      ok: true,
      step: {
        sessionId: data.session_id,
        complete: false,
        item: stripItem(data.first_item),
        itemsDone: 0,
        theta: data.initial_theta ?? 0,
      },
    }
  } catch (error) {
    console.error("Error in startVocabCat:", error)
    return {
      ok: false,
      error: "진단 서버 연결에 실패했습니다. 잠시 후 다시 시도하세요.",
    }
  }
}

/**
 * 학생이 보기를 하나 골랐다. 서버가 정답 여부를 판정해 Cloud Run 에 전달하고
 * 다음 문항(또는 결과)을 반환한다.
 * chosenOption 은 보기 텍스트다(인덱스가 아니라 값 — 클라이언트 조작 여지 축소).
 */
export async function answerVocabCat(params: {
  sessionId: string
  chosenOption: string
  responseTimeMs?: number
  isDontKnow?: boolean
}): Promise<{ ok: boolean; step?: CatStep; error?: string }> {
  try {
    const sess = await turso.execute({
      sql: `SELECT student_id, current_item, items_done, status
            FROM kes_cat_sessions WHERE session_id = ?`,
      args: [params.sessionId],
    })
    if (sess.rows.length === 0) return { ok: false, error: "세션을 찾을 수 없습니다." }
    const row = sess.rows[0]
    if (String(row.status) !== "active") {
      return { ok: false, error: "이미 종료된 세션입니다." }
    }
    const studentId = String(row.student_id)
    const pending = JSON.parse(String(row.current_item))

    // 서버 측 채점: 고른 보기 텍스트 === 정답 텍스트.
    // "모르겠어요"는 오답으로 처리하되 is_dont_know 로 표시(엔진이 능력추정에
    // 다르게 반영할 수 있다).
    const isCorrect = !params.isDontKnow && params.chosenOption === pending.correct_answer

    const data = await catFetch(
      `/api/v1/test/${params.sessionId}/respond`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: pending.item_id,
          is_correct: isCorrect,
          is_dont_know: Boolean(params.isDontKnow),
          response_time_ms: params.responseTimeMs ?? null,
        }),
      },
      STEP_TIMEOUT_MS,
    )

    const progress = data.progress ?? {}

    if (data.is_complete) {
      const r = data.results
      // 세션 종료 + 스냅샷 승격
      await turso.batch([
        {
          sql: `UPDATE kes_cat_sessions
                SET status='complete', current_item=NULL,
                    items_done=?, current_theta=?, updated_at=datetime('now')
                WHERE session_id=?`,
          args: [progress.items_completed ?? null, r.theta ?? null, params.sessionId],
        },
        {
          sql: `INSERT INTO kes_diagnosis_snapshots
                  (id, student_id, kind, scale, value_num, value_text, detail, source)
                VALUES (?, ?, 'vocab_cat', 'theta_2pl', ?, ?, ?, 'vocab-cat-api')`,
          args: [
            ulid(),
            studentId,
            r.theta ?? null,
            r.cefr_level ?? null,
            JSON.stringify({
              session_id: params.sessionId,
              se: r.se,
              reliability: r.reliability,
              cefr_probabilities: r.cefr_probabilities,
              curriculum_level: r.curriculum_level,
              vocab_size_estimate: r.vocab_size_estimate,
              total_items: r.total_items,
              total_correct: r.total_correct,
              accuracy: r.accuracy,
              termination_reason: r.termination_reason,
              dimension_scores: r.dimension_scores,
              topic_strengths: r.topic_strengths,
              topic_weaknesses: r.topic_weaknesses,
              engine: "vocab-cat-api@0.2.0",
            }),
          ],
        },
      ])

      return {
        ok: true,
        step: {
          sessionId: params.sessionId,
          complete: true,
          item: null,
          itemsDone: progress.items_completed ?? 0,
          theta: r.theta ?? 0,
          result: {
            theta: r.theta,
            se: r.se,
            cefr: r.cefr_level,
            vocabSize: r.vocab_size_estimate,
            curriculumLevel: r.curriculum_level,
            accuracy: r.accuracy,
            totalItems: r.total_items,
          },
        },
      }
    }

    // 다음 문항 저장 + 반환
    const nextItem = data.next_item
    await turso.execute({
      sql: `UPDATE kes_cat_sessions
            SET current_item=?, items_done=?, current_theta=?, updated_at=datetime('now')
            WHERE session_id=?`,
      args: [
        JSON.stringify(pendingFromItem(nextItem)),
        progress.items_completed ?? Number(row.items_done) + 1,
        progress.current_theta ?? null,
        params.sessionId,
      ],
    })

    return {
      ok: true,
      step: {
        sessionId: params.sessionId,
        complete: false,
        item: stripItem(nextItem),
        itemsDone: progress.items_completed ?? 0,
        theta: progress.current_theta ?? 0,
      },
    }
  } catch (error) {
    console.error("Error in answerVocabCat:", error)
    return { ok: false, error: "응답 처리 중 오류가 발생했습니다." }
  }
}

/**
 * 범용 진단 스냅샷 저장. lexile-test 완료 시 학생 컨텍스트가 있으면 호출한다.
 * kind: 'lexile' | 'skill_cefr'; scale 은 kind 에 맞춰 자동.
 */
export async function saveDiagnosis(params: {
  studentId: string
  kind: "lexile" | "skill_cefr"
  dimension?: string
  valueNum?: number
  valueText?: string
  detail?: unknown
  source?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const scale = params.kind === "lexile" ? "lexile" : "cefr"
    await turso.execute({
      sql: `INSERT INTO kes_diagnosis_snapshots
              (id, student_id, kind, dimension, scale, value_num, value_text, detail, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        ulid(),
        params.studentId,
        params.kind,
        params.dimension ?? null,
        scale,
        params.valueNum ?? null,
        params.valueText ?? null,
        params.detail ? JSON.stringify(params.detail) : null,
        params.source ?? "in-app",
      ],
    })
    return { ok: true }
  } catch (error) {
    console.error("Error in saveDiagnosis:", error)
    return { ok: false, error: "진단 결과 저장에 실패했습니다." }
  }
}

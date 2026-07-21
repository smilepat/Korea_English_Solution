// ============================================================
// lib/student-identity.ts — 학생 기기 식별(클라이언트 전용, localStorage)
//
// csat-reasoning-bridge-builder/lib/identity.ts 패턴을 가져오되,
// 자유 닉네임 대신 교사 명부에서 해석된 canonical studentId 를 보관한다.
// (Phase 1 결정: 학생 신원은 교사가 소유. 자유 입력으로 행을 만들지 않는다)
//
// 여기 저장되는 것은 "이 브라우저가 지난번에 어느 반의 어느 학생이었나"이다.
// 실제 신원 해석은 서버(app/actions/student-auth.ts)가 하고, 그 결과만 캐싱한다.
// ============================================================

import { normalizeCode } from "@/lib/kes-ids"

export interface StudentSession {
  classCode: string
  studentId: string
  studentName: string
}

const KEY = "kes_student_identity"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

/** 반 코드별로 마지막 신원을 기억한다(형제·공용 기기 대비). */
function readAll(): Record<string, StudentSession> {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const o = JSON.parse(raw)
    return o && typeof o === "object" ? o : {}
  } catch {
    return {}
  }
}

/** 특정 반 코드에 대해 이 기기에 기억된 학생 신원. */
export function getStudentSession(classCode: string): StudentSession | null {
  const code = normalizeCode(classCode)
  const all = readAll()
  const s = all[code]
  if (s && s.studentId && s.classCode) return s
  return null
}

export function setStudentSession(session: StudentSession): void {
  if (!isBrowser()) return
  const code = normalizeCode(session.classCode)
  if (!code || !session.studentId) return
  const all = readAll()
  all[code] = { ...session, classCode: code }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // ignore quota/private-mode
  }
}

/** "내가 아님" — 공용 기기에서 다른 학생으로 바꿀 때. */
export function clearStudentSession(classCode: string): void {
  if (!isBrowser()) return
  const code = normalizeCode(classCode)
  const all = readAll()
  delete all[code]
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

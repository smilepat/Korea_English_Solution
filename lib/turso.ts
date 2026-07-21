import { createClient, type Client } from "@libsql/client"

// ============================================================
// 클라이언트 생성 (env-gated graceful fallback)
//
// 모듈 로드 시점에 throw 하지 않는다. env 가 없으면 빌드·테스트·로컬 개발이
// 전부 막히기 때문. 대신:
//   1. TURSO_DATABASE_URL + TOKEN 있음  → 원격 Turso (운영·개발 공통)
//   2. file: URL 만 있음                → 로컬 SQLite 파일
//   3. 아무것도 없음 + 비운영            → file:./local.db 로 폴백 (경고 1회)
//   4. 아무것도 없음 + 운영              → 쿼리 시점에 명확한 에러 (로드 시점 아님)
//
// 주의: 이 DB 는 `connectedu` org 소속이다. 토큰 발급 시 org 전환 필요.
// ============================================================

const LOCAL_FALLBACK_URL = "file:./local.db"

function readEnv() {
  const url = process.env.TURSO_DATABASE_URL?.trim()
  // 토큰에 줄바꿈·따옴표가 섞여 들어오는 사고가 잦아 방어적으로 정리한다
  // (scripts/seed-kcsdb.mjs 와 동일한 처리)
  const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/[^A-Za-z0-9._-]/g, "")
  return { url, authToken }
}

/** env 미설정 상태로 운영에서 쿼리가 실행되면 그때 실패시키는 클라이언트. */
function createUnconfiguredClient(): Client {
  const fail = () => {
    throw new Error(
      "Turso 가 설정되지 않았습니다. TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 환경변수를 확인하세요. " +
        "(DB 는 connectedu org 소속 — 토큰 발급 시 org 전환 필요)",
    )
  }
  return new Proxy({} as Client, { get: fail, apply: fail })
}

let warned = false

function createTursoClient(): Client {
  const { url, authToken } = readEnv()

  if (url && authToken) return createClient({ url, authToken })
  if (url?.startsWith("file:")) return createClient({ url })

  if (process.env.NODE_ENV === "production") return createUnconfiguredClient()

  if (!warned) {
    warned = true
    console.warn(
      `[turso] TURSO_DATABASE_URL/TOKEN 미설정 → ${LOCAL_FALLBACK_URL} 로 폴백합니다. ` +
        "스키마 적용: node scripts/run-kes-schema.mjs",
    )
  }
  return createClient({ url: LOCAL_FALLBACK_URL })
}

// HMR 로 인한 클라이언트 중복 생성을 막는다 (opsdeck lib/db.ts 패턴)
const globalForTurso = globalThis as unknown as { __turso?: Client }

export const turso: Client = globalForTurso.__turso ?? createTursoClient()
if (process.env.NODE_ENV !== "production") globalForTurso.__turso = turso

/** 원격 Turso 에 실제로 연결된 상태인지. 진단·시드 스크립트용. */
export function isTursoConfigured(): boolean {
  const { url, authToken } = readEnv()
  return Boolean((url && authToken) || url?.startsWith("file:"))
}

// ============================================================
// 타입 정의
// ============================================================

export interface KnowledgeDocument {
  id: number
  type: "curriculum" | "research" | "news" | "lesson" | "policy" | "csat"
  title: string
  content: string
  source?: string
  date?: string
  keywords?: string[]
  edu_level?: "elementary" | "middle" | "high" | "all"
  skill?: "reading" | "writing" | "listening" | "speaking" | "all"
  ai_summary?: string
  ai_implications?: string
  created_at: string
  updated_at: string
}

export interface CurriculumStandard {
  id: number
  curriculum: string
  grade: string
  skill: string
  description: string
  cefr_level?: string
  lexile_min?: number
  lexile_max?: number
  keywords?: string[]
  created_at: string
}

export interface CsatItem {
  id: number
  year?: number
  item_number?: number
  type: string
  passage: string
  question: string
  options: string[]
  answer?: number
  lexile_level?: number
  difficulty?: "easy" | "medium" | "hard"
  ai_analysis?: string
  created_at: string
}

export interface LessonCase {
  id: number
  grade: string
  skill: string
  topic: string
  objectives?: string
  activity?: string
  material?: string
  lexile_range?: string
  duration?: string
  outcome?: string
  teacher_notes?: string
  created_at: string
}

export interface TeacherSession {
  id: number
  session_id: string
  feature: "curriculum" | "lesson" | "assessment" | "search" | "policy" | "lexile"
  messages: Array<{ role: "user" | "assistant"; content: string }>
  created_at: string
}

// ============================================================
// 헬퍼: JSON 파싱
// ============================================================

export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value) return fallback
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value as T
}

import { createClient } from "@libsql/client"

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL 환경변수가 설정되지 않았습니다.")
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_AUTH_TOKEN 환경변수가 설정되지 않았습니다.")
}

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

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

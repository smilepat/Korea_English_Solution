"use server"

import { turso } from "@/lib/turso"
import { generateReadingMaterial } from "@/lib/gemini"

// ============================================================
// 읽기 자료 생성 (AI)
// ============================================================

export async function generateReading(params: {
  lexileLevel: number
  topic: string
  wordCount: number
  genre: string
}): Promise<{
  success: boolean
  material?: {
    id: number
    title: string
    content: string
    vocabulary: string[]
    questions: Array<{ question: string; options: string[]; answer: number }>
    lexile_level: number
    topic: string
    genre: string
    word_count: number
    created_at: string
  }
  error?: string
}> {
  try {
    const generated = await generateReadingMaterial({
      lexileLevel: params.lexileLevel,
      topic: params.topic,
      wordCount: params.wordCount,
      genre: params.genre as "narrative" | "expository" | "persuasive",
    })

    const result = await turso.execute({
      sql: `INSERT INTO reading_materials (title, content, vocabulary, questions, lexile_level, topic, genre, word_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        generated.title,
        generated.content,
        JSON.stringify(generated.vocabulary),
        JSON.stringify(generated.questions),
        params.lexileLevel,
        params.topic,
        params.genre,
        params.wordCount,
      ],
    })

    const id = Number(result.lastInsertRowid)

    return {
      success: true,
      material: {
        id,
        title: generated.title,
        content: generated.content,
        vocabulary: generated.vocabulary,
        questions: generated.questions,
        lexile_level: params.lexileLevel,
        topic: params.topic,
        genre: params.genre,
        word_count: params.wordCount,
        created_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("읽기 자료 생성 오류:", error)
    return { success: false, error: "읽기 자료 생성 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 읽기 자료 목록 조회
// ============================================================

export async function getReadingMaterials(params?: {
  lexileLevel?: number
}): Promise<
  Array<{
    id: number
    title: string
    content: string
    vocabulary: string[]
    questions: Array<{ question: string; options: string[]; answer: number }>
    lexile_level: number
    topic: string
    genre: string
    word_count: number
    created_at: string
  }>
> {
  try {
    let sql = "SELECT * FROM reading_materials WHERE 1=1"
    const args: (string | number)[] = []

    if (params?.lexileLevel) {
      sql += " AND lexile_level = ?"
      args.push(params.lexileLevel)
    }

    sql += " ORDER BY created_at DESC LIMIT 50"

    const result = await turso.execute({ sql, args })

    return result.rows.map((row) => ({
      id: row.id as number,
      title: row.title as string,
      content: row.content as string,
      vocabulary: parseJson<string[]>(row.vocabulary, []),
      questions: parseJson<Array<{ question: string; options: string[]; answer: number }>>(row.questions, []),
      lexile_level: row.lexile_level as number,
      topic: row.topic as string,
      genre: row.genre as string,
      word_count: row.word_count as number,
      created_at: row.created_at as string,
    }))
  } catch (error) {
    console.error("읽기 자료 조회 오류:", error)
    return []
  }
}

// ============================================================
// 읽기 기록 저장
// ============================================================

export async function saveReadingLog(params: {
  materialId: number
  wordsRead: number
  score: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    await turso.execute({
      sql: `INSERT INTO reading_logs (material_id, words_read, score)
            VALUES (?, ?, ?)`,
      args: [params.materialId, params.wordsRead, params.score],
    })

    return { success: true }
  } catch (error) {
    console.error("읽기 기록 저장 오류:", error)
    return { success: false, error: "읽기 기록 저장 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 읽기 통계 조회
// ============================================================

export async function getReadingStats(): Promise<{
  totalWordsRead: number
  totalMaterialsRead: number
  averageScore: number
  logs: Array<{
    id: number
    material_id: number
    words_read: number
    score: number
    created_at: string
    title?: string
  }>
}> {
  try {
    const statsResult = await turso.execute({
      sql: `SELECT
              COALESCE(SUM(words_read), 0) as total_words,
              COUNT(*) as total_materials,
              COALESCE(AVG(score), 0) as avg_score
            FROM reading_logs`,
      args: [],
    })

    const row = statsResult.rows[0]

    const logsResult = await turso.execute({
      sql: `SELECT rl.*, rm.title
            FROM reading_logs rl
            LEFT JOIN reading_materials rm ON rl.material_id = rm.id
            ORDER BY rl.created_at DESC
            LIMIT 30`,
      args: [],
    })

    const logs = logsResult.rows.map((r) => ({
      id: r.id as number,
      material_id: r.material_id as number,
      words_read: r.words_read as number,
      score: r.score as number,
      created_at: r.created_at as string,
      title: (r.title as string) || undefined,
    }))

    return {
      totalWordsRead: (row?.total_words as number) || 0,
      totalMaterialsRead: (row?.total_materials as number) || 0,
      averageScore: Math.round(((row?.avg_score as number) || 0) * 10) / 10,
      logs,
    }
  } catch (error) {
    console.error("읽기 통계 조회 오류:", error)
    return { totalWordsRead: 0, totalMaterialsRead: 0, averageScore: 0, logs: [] }
  }
}

// ============================================================
// 헬퍼
// ============================================================

function parseJson<T>(value: unknown, fallback: T): T {
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

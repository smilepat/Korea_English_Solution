"use server"

import { turso, parseJsonField, type KnowledgeDocument, type CurriculumStandard } from "@/lib/turso"
import { processKnowledgeDocument } from "@/lib/ai"

// ============================================================
// 지식 문서 CRUD
// ============================================================

export async function getKnowledgeDocuments(params?: {
  type?: string
  skill?: string
  edu_level?: string
  limit?: number
}): Promise<KnowledgeDocument[]> {
  try {
    let sql = "SELECT * FROM knowledge_documents WHERE 1=1"
    const args: (string | number)[] = []

    if (params?.type) {
      sql += " AND type = ?"
      args.push(params.type)
    }
    if (params?.skill) {
      sql += " AND skill = ?"
      args.push(params.skill)
    }
    if (params?.edu_level) {
      sql += " AND edu_level = ?"
      args.push(params.edu_level)
    }

    sql += " ORDER BY updated_at DESC LIMIT ?"
    args.push(params?.limit ?? 20)

    const result = await turso.execute({ sql, args })

    return result.rows.map((row) => ({
      id: row.id as number,
      type: row.type as KnowledgeDocument["type"],
      title: row.title as string,
      content: row.content as string,
      source: (row.source as string) || undefined,
      date: (row.date as string) || undefined,
      keywords: parseJsonField<string[]>(row.keywords, []),
      edu_level: (row.edu_level as KnowledgeDocument["edu_level"]) || undefined,
      skill: (row.skill as KnowledgeDocument["skill"]) || undefined,
      ai_summary: (row.ai_summary as string) || undefined,
      ai_implications: (row.ai_implications as string) || undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }))
  } catch (error) {
    console.error("지식 문서 조회 오류:", error)
    return []
  }
}

export async function addKnowledgeDocument(data: {
  type: KnowledgeDocument["type"]
  title: string
  content: string
  source?: string
  date?: string
  edu_level?: string
  skill?: string
}): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    // AI로 요약·키워드·교육적 함의 자동 생성
    const aiResult = await processKnowledgeDocument(data.title, data.content)

    const result = await turso.execute({
      sql: `INSERT INTO knowledge_documents
              (type, title, content, source, date, keywords, edu_level, skill, ai_summary, ai_implications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.type,
        data.title,
        data.content,
        data.source ?? null,
        data.date ?? null,
        JSON.stringify(aiResult.keywords),
        data.edu_level ?? null,
        data.skill ?? null,
        aiResult.summary,
        aiResult.implications,
      ],
    })

    return { success: true, id: Number(result.lastInsertRowid) }
  } catch (error) {
    console.error("지식 문서 추가 오류:", error)
    return { success: false, error: String(error) }
  }
}

export async function searchKnowledgeDocuments(query: string): Promise<KnowledgeDocument[]> {
  try {
    const keywords = query.split(/\s+/).filter((k) => k.length > 1)
    if (keywords.length === 0) return []

    const conditions = keywords
      .map(() => "(title LIKE ? OR content LIKE ? OR keywords LIKE ? OR ai_summary LIKE ?)")
      .join(" OR ")
    const params = keywords.flatMap((k) => [`%${k}%`, `%${k}%`, `%${k}%`, `%${k}%`])

    const result = await turso.execute({
      sql: `SELECT * FROM knowledge_documents WHERE ${conditions}
            ORDER BY updated_at DESC LIMIT 10`,
      args: params,
    })

    return result.rows.map((row) => ({
      id: row.id as number,
      type: row.type as KnowledgeDocument["type"],
      title: row.title as string,
      content: row.content as string,
      source: (row.source as string) || undefined,
      date: (row.date as string) || undefined,
      keywords: parseJsonField<string[]>(row.keywords, []),
      edu_level: (row.edu_level as KnowledgeDocument["edu_level"]) || undefined,
      skill: (row.skill as KnowledgeDocument["skill"]) || undefined,
      ai_summary: (row.ai_summary as string) || undefined,
      ai_implications: (row.ai_implications as string) || undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }))
  } catch (error) {
    console.error("지식 문서 검색 오류:", error)
    return []
  }
}

// ============================================================
// 교육과정 성취기준 조회
// ============================================================

export async function getCurriculumStandards(params?: {
  curriculum?: string
  grade?: string
  skill?: string
}): Promise<CurriculumStandard[]> {
  try {
    let sql = "SELECT * FROM curriculum_standards WHERE 1=1"
    const args: string[] = []

    if (params?.curriculum) {
      sql += " AND curriculum = ?"
      args.push(params.curriculum)
    }
    if (params?.grade) {
      sql += " AND grade = ?"
      args.push(params.grade)
    }
    if (params?.skill) {
      sql += " AND skill = ?"
      args.push(params.skill)
    }

    sql += " ORDER BY curriculum DESC, grade ASC"

    const result = await turso.execute({ sql, args })

    return result.rows.map((row) => ({
      id: row.id as number,
      curriculum: row.curriculum as string,
      grade: row.grade as string,
      skill: row.skill as string,
      description: row.description as string,
      cefr_level: (row.cefr_level as string) || undefined,
      lexile_min: (row.lexile_min as number) || undefined,
      lexile_max: (row.lexile_max as number) || undefined,
      keywords: parseJsonField<string[]>(row.keywords, []),
      created_at: row.created_at as string,
    }))
  } catch (error) {
    console.error("성취기준 조회 오류:", error)
    return []
  }
}

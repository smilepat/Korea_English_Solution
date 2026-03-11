"use server"

import { turso, parseJsonField, type CsatItem } from "@/lib/turso"
import { generateCsatItem } from "@/lib/ai"

// ============================================================
// 수능 문항 생성 (AI)
// ============================================================

export async function createCsatItem(params: {
  type: string
  passage?: string
  topic?: string
  lexileLevel?: number
  difficulty?: string
}): Promise<{ success: boolean; item?: CsatItem; error?: string }> {
  try {
    const generated = await generateCsatItem(params)

    const result = await turso.execute({
      sql: `INSERT INTO csat_items (type, passage, question, options, answer, lexile_level, difficulty, ai_analysis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        params.type,
        generated.passage,
        generated.question,
        JSON.stringify(generated.options),
        generated.answer,
        params.lexileLevel ?? null,
        params.difficulty ?? "medium",
        generated.explanation,
      ],
    })

    const id = Number(result.lastInsertRowid)

    return {
      success: true,
      item: {
        id,
        type: params.type,
        passage: generated.passage,
        question: generated.question,
        options: generated.options,
        answer: generated.answer,
        lexile_level: params.lexileLevel,
        difficulty: (params.difficulty as CsatItem["difficulty"]) ?? "medium",
        ai_analysis: generated.explanation,
        created_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("수능 문항 생성 오류:", error)
    return { success: false, error: "문항 생성 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 수능 문항 목록 조회
// ============================================================

export async function getCsatItems(params?: {
  type?: string
  difficulty?: string
  limit?: number
}): Promise<CsatItem[]> {
  try {
    let sql = "SELECT * FROM csat_items WHERE 1=1"
    const args: (string | number)[] = []

    if (params?.type) {
      sql += " AND type = ?"
      args.push(params.type)
    }
    if (params?.difficulty) {
      sql += " AND difficulty = ?"
      args.push(params.difficulty)
    }

    sql += " ORDER BY created_at DESC LIMIT ?"
    args.push(params?.limit ?? 20)

    const result = await turso.execute({ sql, args })

    return result.rows.map((row) => ({
      id: row.id as number,
      year: (row.year as number) || undefined,
      item_number: (row.item_number as number) || undefined,
      type: row.type as string,
      passage: row.passage as string,
      question: row.question as string,
      options: parseJsonField<string[]>(row.options, []),
      answer: (row.answer as number) || undefined,
      lexile_level: (row.lexile_level as number) || undefined,
      difficulty: (row.difficulty as CsatItem["difficulty"]) || undefined,
      ai_analysis: (row.ai_analysis as string) || undefined,
      created_at: row.created_at as string,
    }))
  } catch (error) {
    console.error("수능 문항 조회 오류:", error)
    return []
  }
}

// ============================================================
// 수능 문항 삭제
// ============================================================

export async function deleteCsatItem(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await turso.execute({ sql: "DELETE FROM csat_items WHERE id = ?", args: [id] })
    return { success: true }
  } catch (error) {
    console.error("수능 문항 삭제 오류:", error)
    return { success: false, error: String(error) }
  }
}

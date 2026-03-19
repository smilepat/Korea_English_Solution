"use server"

import { turso, parseJsonField, type CsatItem } from "@/lib/turso"
import { generateCsatItem, analyzeCsatItem, predictDifficulty } from "@/lib/ai"

// ============================================================
// 수능 문항 생성 (AI)
// ============================================================

export async function createCsatItem(params: {
  type: string
  passage?: string
  topic?: string
  lexileLevel?: number
  difficulty?: string
  model?: string
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

// ============================================================
// 수능 문항 구조 분석 (AI)
// ============================================================

export async function analyzeCsatItemAction(id: number): Promise<{ success: boolean; analysis?: any; error?: string }> {
  try {
    // 1. 문항 조회
    const result = await turso.execute({ sql: "SELECT * FROM csat_items WHERE id = ?", args: [id] })
    if (result.rows.length === 0) return { success: false, error: "문항을 찾을 수 없습니다." }

    const item = result.rows[0]
    const options = JSON.parse(item.options as string)

    // 2. AI 분석
    const analysis = await analyzeCsatItem(
      item.passage as string,
      item.question as string,
      options,
      item.answer as number,
      item.type as string,
    )

    // 3. 분석 결과 저장
    await turso.execute({
      sql: `UPDATE csat_items SET
        passage_metrics = ?,
        coherence_profile = ?,
        abstractness_map = ?,
        vocab_profile = ?,
        structure_analysis = ?,
        skills = ?,
        distractor_analysis = ?
      WHERE id = ?`,
      args: [
        JSON.stringify(analysis.passage_metrics),
        JSON.stringify(analysis.coherence_profile),
        JSON.stringify(analysis.abstractness_map),
        JSON.stringify(analysis.vocab_profile),
        JSON.stringify(analysis.structure_analysis),
        JSON.stringify(analysis.skills),
        JSON.stringify(analysis.distractor_analysis),
        id,
      ],
    })

    return { success: true, analysis }
  } catch (error) {
    console.error("Error in analyzeCsatItemAction:", error)
    return { success: false, error: "문항 분석 중 오류가 발생했습니다." }
  }
}

// ============================================================
// 수능 문항 난이도 예측 (AI)
// ============================================================

export async function predictDifficultyAction(id: number): Promise<{ success: boolean; prediction?: any; error?: string }> {
  try {
    const result = await turso.execute({ sql: "SELECT * FROM csat_items WHERE id = ?", args: [id] })
    if (result.rows.length === 0) return { success: false, error: "문항을 찾을 수 없습니다." }

    const item = result.rows[0]
    if (!item.passage_metrics) return { success: false, error: "먼저 문항 분석을 실행해주세요." }

    const analysis = {
      passage_metrics: JSON.parse(item.passage_metrics as string),
      coherence_profile: JSON.parse(item.coherence_profile as string),
      abstractness_map: JSON.parse(item.abstractness_map as string),
      vocab_profile: JSON.parse(item.vocab_profile as string),
      structure_analysis: JSON.parse(item.structure_analysis as string),
    }

    const prediction = await predictDifficulty(analysis, item.type as string)
    return { success: true, prediction }
  } catch (error) {
    console.error("Error in predictDifficultyAction:", error)
    return { success: false, error: "난이도 예측 중 오류가 발생했습니다." }
  }
}

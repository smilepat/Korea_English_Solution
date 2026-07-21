"use server"

import { turso } from "@/lib/turso"
import { ulid } from "@/lib/kes-ids"

export interface Problem {
  id: string
  text: string
  checked: boolean
  created_at: string
  updated_at: string
}

function toProblem(row: Record<string, unknown>): Problem {
  return {
    id: String(row.id),
    text: String(row.text ?? ""),
    checked: Number(row.checked ?? 0) === 1,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  }
}

export async function getProblems(): Promise<Problem[]> {
  try {
    const r = await turso.execute(
      `SELECT id, text, checked, created_at, updated_at
       FROM kes_problems ORDER BY created_at ASC`,
    )
    return r.rows.map((row) => toProblem(row as unknown as Record<string, unknown>))
  } catch (error) {
    console.error("Error in getProblems:", error)
    return []
  }
}

export async function addProblem(
  text: string,
): Promise<{ success: boolean; data?: Problem; error?: string }> {
  try {
    const id = ulid()
    await turso.execute({
      sql: "INSERT INTO kes_problems (id, text, checked) VALUES (?, ?, 0)",
      args: [id, text],
    })
    const r = await turso.execute({
      sql: `SELECT id, text, checked, created_at, updated_at
            FROM kes_problems WHERE id = ?`,
      args: [id],
    })
    return {
      success: true,
      data: toProblem(r.rows[0] as unknown as Record<string, unknown>),
    }
  } catch (error) {
    console.error("Error in addProblem:", error)
    return { success: false, error: "Failed to add problem" }
  }
}

export async function updateProblem(
  id: string,
  checked: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await turso.execute({
      sql: `UPDATE kes_problems
            SET checked = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [checked ? 1 : 0, id],
    })
    return { success: true }
  } catch (error) {
    console.error("Error in updateProblem:", error)
    return { success: false, error: "Failed to update problem" }
  }
}

export async function deleteProblem(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await turso.execute({ sql: "DELETE FROM kes_problems WHERE id = ?", args: [id] })
    return { success: true }
  } catch (error) {
    console.error("Error in deleteProblem:", error)
    return { success: false, error: "Failed to delete problem" }
  }
}

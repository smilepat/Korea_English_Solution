"use server"

import { supabase } from "@/lib/supabase"

export interface Problem {
  id: number
  text: string
  checked: boolean
  created_at: string
  updated_at: string
}

export async function getProblems(): Promise<Problem[]> {
  try {
    const { data, error } = await supabase.from("problems").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching problems:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getProblems:", error)
    return []
  }
}

export async function addProblem(text: string): Promise<{ success: boolean; data?: Problem; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("problems")
      .insert([{ text, checked: false }])
      .select()
      .single()

    if (error) {
      console.error("Error adding problem:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in addProblem:", error)
    return { success: false, error: "Failed to add problem" }
  }
}

export async function updateProblem(id: number, checked: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("problems")
      .update({ checked, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Error updating problem:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateProblem:", error)
    return { success: false, error: "Failed to update problem" }
  }
}

export async function deleteProblem(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("problems").delete().eq("id", id)

    if (error) {
      console.error("Error deleting problem:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteProblem:", error)
    return { success: false, error: "Failed to delete problem" }
  }
}

"use server"

import { supabase } from "@/lib/supabase"

export interface LexileTestResult {
  id: number
  user_id: string | null
  score: number | null
  level: string | null
  test_date: string
  answers: any | null
}

export async function saveLexileTestResult(
  score: number,
  level: string,
  answers: any,
): Promise<{ success: boolean; data?: LexileTestResult; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("lexile_test_results")
      .insert([
        {
          score,
          level,
          answers,
          test_date: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error saving lexile test result:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in saveLexileTestResult:", error)
    return { success: false, error: "Failed to save test result" }
  }
}

export async function getLexileTestResults(): Promise<LexileTestResult[]> {
  try {
    const { data, error } = await supabase
      .from("lexile_test_results")
      .select("*")
      .order("test_date", { ascending: false })

    if (error) {
      console.error("Error fetching lexile test results:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getLexileTestResults:", error)
    return []
  }
}

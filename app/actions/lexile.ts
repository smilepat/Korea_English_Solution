"use server"

import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"

export interface LexileTestResult {
  id: string
  user_id: string | null
  score: number | null
  level: string | null
  test_date: string
  answers: any | null
}

function toISOString(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString()
  if (typeof val === "string") return val
  return new Date().toISOString()
}

export async function saveLexileTestResult(
  score: number,
  level: string,
  answers: any,
): Promise<{ success: boolean; data?: LexileTestResult; error?: string }> {
  try {
    const ref = await addDoc(collection(db, "lexile_test_results"), {
      user_id: null,
      score,
      level,
      answers,
      test_date: serverTimestamp(),
    })
    const isoNow = new Date().toISOString()
    return {
      success: true,
      data: { id: ref.id, user_id: null, score, level, test_date: isoNow, answers },
    }
  } catch (error) {
    console.error("Error in saveLexileTestResult:", error)
    return { success: false, error: "Failed to save test result" }
  }
}

export async function getLexileTestResults(): Promise<LexileTestResult[]> {
  try {
    const q = query(collection(db, "lexile_test_results"), orderBy("test_date", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        user_id: data.user_id ?? null,
        score: data.score ?? null,
        level: data.level ?? null,
        test_date: toISOString(data.test_date),
        answers: data.answers ?? null,
      }
    })
  } catch (error) {
    console.error("Error in getLexileTestResults:", error)
    return []
  }
}

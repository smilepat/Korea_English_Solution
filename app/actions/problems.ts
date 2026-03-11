"use server"

import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"

export interface Problem {
  id: string
  text: string
  checked: boolean
  created_at: string
  updated_at: string
}

function toISOString(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString()
  if (typeof val === "string") return val
  return new Date().toISOString()
}

export async function getProblems(): Promise<Problem[]> {
  try {
    const q = query(collection(db, "problems"), orderBy("created_at", "asc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        text: data.text,
        checked: data.checked ?? false,
        created_at: toISOString(data.created_at),
        updated_at: toISOString(data.updated_at),
      }
    })
  } catch (error) {
    console.error("Error in getProblems:", error)
    return []
  }
}

export async function addProblem(text: string): Promise<{ success: boolean; data?: Problem; error?: string }> {
  try {
    const now = serverTimestamp()
    const ref = await addDoc(collection(db, "problems"), {
      text,
      checked: false,
      created_at: now,
      updated_at: now,
    })
    const isoNow = new Date().toISOString()
    return {
      success: true,
      data: { id: ref.id, text, checked: false, created_at: isoNow, updated_at: isoNow },
    }
  } catch (error) {
    console.error("Error in addProblem:", error)
    return { success: false, error: "Failed to add problem" }
  }
}

export async function updateProblem(id: string, checked: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(doc(db, "problems", id), {
      checked,
      updated_at: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error in updateProblem:", error)
    return { success: false, error: "Failed to update problem" }
  }
}

export async function deleteProblem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, "problems", id))
    return { success: true }
  } catch (error) {
    console.error("Error in deleteProblem:", error)
    return { success: false, error: "Failed to delete problem" }
  }
}

"use server"

import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  deleteDoc,
} from "firebase/firestore"
import { callGemini } from "@/lib/gemini"

// ============================================================
// Types
// ============================================================

export interface Student {
  id: string
  name: string
  grade: string
  classNum: string
  lexile_level: number
  skills: {
    reading: string
    writing: string
    listening: string
    speaking: string
  }
  lexile_history: Array<{ date: string; level: number }>
}

export interface Prescription {
  activities: Array<{ title: string; description: string }>
  materials: Array<{ title: string; description: string }>
  goals: Array<{ title: string; description: string }>
}

export interface ClassReport {
  analysis: string
  groups: Array<{
    name: string
    students: string[]
    strategy: string
  }>
}

// ============================================================
// CRUD
// ============================================================

export async function addStudent(params: {
  name: string
  grade: string
  classNum: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ref = await addDoc(collection(db, "students"), {
      name: params.name,
      grade: params.grade,
      classNum: params.classNum,
      lexile_level: 0,
      skills: {
        reading: "",
        writing: "",
        listening: "",
        speaking: "",
      },
      lexile_history: [],
      createdAt: new Date().toISOString(),
    })
    return { success: true, id: ref.id }
  } catch (error) {
    console.error("Error in addStudent:", error)
    return { success: false, error: "학생 추가에 실패했습니다." }
  }
}

export async function getStudents(params?: {
  grade?: string
  classNum?: string
}): Promise<Student[]> {
  try {
    const constraints: ReturnType<typeof where>[] = []
    if (params?.grade) {
      constraints.push(where("grade", "==", params.grade))
    }
    if (params?.classNum) {
      constraints.push(where("classNum", "==", params.classNum))
    }

    const q = query(
      collection(db, "students"),
      ...constraints,
      orderBy("name", "asc"),
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name ?? "",
        grade: data.grade ?? "",
        classNum: data.classNum ?? "",
        lexile_level: data.lexile_level ?? 0,
        skills: data.skills ?? {
          reading: "",
          writing: "",
          listening: "",
          speaking: "",
        },
        lexile_history: data.lexile_history ?? [],
      }
    })
  } catch (error) {
    console.error("Error in getStudents:", error)
    return []
  }
}

export async function updateStudentLexile(
  studentId: string,
  lexileLevel: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = doc(db, "students", studentId)
    const studentsSnap = await getDocs(
      query(collection(db, "students")),
    )
    const studentDoc = studentsSnap.docs.find((d) => d.id === studentId)
    const currentHistory = studentDoc?.data()?.lexile_history ?? []

    const newEntry = {
      date: new Date().toISOString().split("T")[0],
      level: lexileLevel,
    }

    await updateDoc(ref, {
      lexile_level: lexileLevel,
      lexile_history: [...currentHistory, newEntry],
    })
    return { success: true }
  } catch (error) {
    console.error("Error in updateStudentLexile:", error)
    return { success: false, error: "Lexile 수준 업데이트에 실패했습니다." }
  }
}

export async function updateStudentSkill(
  studentId: string,
  skill: string,
  cefrLevel: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = doc(db, "students", studentId)
    await updateDoc(ref, {
      [`skills.${skill}`]: cefrLevel,
    })
    return { success: true }
  } catch (error) {
    console.error("Error in updateStudentSkill:", error)
    return { success: false, error: "기능 수준 업데이트에 실패했습니다." }
  }
}

export async function deleteStudent(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, "students", id))
    return { success: true }
  } catch (error) {
    console.error("Error in deleteStudent:", error)
    return { success: false, error: "학생 삭제에 실패했습니다." }
  }
}

// ============================================================
// AI – 개인 학습 처방
// ============================================================

const TEACHER_SYSTEM = `당신은 대한민국 영어교사를 지원하는 AI 어시스턴트입니다.
모든 응답은 한국어로 작성하되, 영어 교육 자료 생성 시에는 영어를 사용합니다.
2022 개정 교육과정, CEFR, Lexile 프레임워크에 대한 전문 지식을 갖추고 있습니다.`

export async function generateStudentPrescription(params: {
  name: string
  lexileLevel: number
  lexileHistory: Array<{ date: string; level: number }>
  skills: Record<string, string>
}): Promise<{ success: boolean; data?: Prescription; error?: string }> {
  try {
    const historyStr = params.lexileHistory
      .map((h) => `${h.date}: ${h.level}L`)
      .join(", ")

    const skillsStr = Object.entries(params.skills)
      .map(([k, v]) => `${k}: ${v || "미측정"}`)
      .join(", ")

    const prompt = `학생 "${params.name}"에 대한 맞춤형 영어 학습 처방을 생성해주세요.

현재 Lexile 수준: ${params.lexileLevel}L
Lexile 변화 이력: ${historyStr || "없음"}
기능별 CEFR 수준: ${skillsStr}

다음 JSON 형식으로 응답해주세요:
{
  "activities": [
    {"title": "활동 제목", "description": "구체적인 활동 설명 (2-3문장)"},
    {"title": "활동 제목", "description": "구체적인 활동 설명"},
    {"title": "활동 제목", "description": "구체적인 활동 설명"}
  ],
  "materials": [
    {"title": "교재/자료 제목", "description": "추천 이유와 활용 방법"},
    {"title": "교재/자료 제목", "description": "추천 이유와 활용 방법"},
    {"title": "교재/자료 제목", "description": "추천 이유와 활용 방법"}
  ],
  "goals": [
    {"title": "학습 목표", "description": "달성 기준과 기간"},
    {"title": "학습 목표", "description": "달성 기준과 기간"},
    {"title": "학습 목표", "description": "달성 기준과 기간"}
  ]
}

각 카테고리별 3개씩 추천해주세요. 학생의 현재 수준과 이력을 고려한 구체적이고 실현 가능한 처방을 작성해주세요.
Return ONLY valid JSON, no markdown formatting.`

    const text = await callGemini(prompt, TEACHER_SYSTEM)
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()
    const data = JSON.parse(cleaned) as Prescription
    return { success: true, data }
  } catch (error) {
    console.error("Error in generateStudentPrescription:", error)
    return { success: false, error: "AI 학습 처방 생성에 실패했습니다." }
  }
}

// ============================================================
// AI – 학급 리포트
// ============================================================

export async function generateClassReport(
  students: Array<{
    name: string
    lexileLevel: number
    skills: Record<string, string>
  }>,
): Promise<{ success: boolean; data?: ClassReport; error?: string }> {
  try {
    const studentInfo = students
      .map((s) => {
        const skills = Object.entries(s.skills)
          .map(([k, v]) => `${k}:${v || "미측정"}`)
          .join(", ")
        return `- ${s.name}: Lexile ${s.lexileLevel}L, ${skills}`
      })
      .join("\n")

    const prompt = `다음 학급 학생들의 영어 수준 데이터를 분석하여 학급 리포트를 생성해주세요.

학생 데이터:
${studentInfo}

다음 JSON 형식으로 응답해주세요:
{
  "analysis": "학급 전체 분석 (3-5문장, 평균 수준, 분포 특성, 주요 관찰 사항 포함)",
  "groups": [
    {
      "name": "그룹명 (예: 상위 그룹)",
      "students": ["학생1", "학생2"],
      "strategy": "이 그룹에 적합한 교수전략 (2-3문장)"
    },
    {
      "name": "그룹명 (예: 중위 그룹)",
      "students": ["학생3", "학생4"],
      "strategy": "이 그룹에 적합한 교수전략"
    },
    {
      "name": "그룹명 (예: 기초 그룹)",
      "students": ["학생5", "학생6"],
      "strategy": "이 그룹에 적합한 교수전략"
    }
  ]
}

수준별로 2-4개 그룹으로 나누고, 각 그룹에 맞는 구체적인 교수전략을 제시해주세요.
Return ONLY valid JSON, no markdown formatting.`

    const text = await callGemini(prompt, TEACHER_SYSTEM)
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()
    const data = JSON.parse(cleaned) as ClassReport
    return { success: true, data }
  } catch (error) {
    console.error("Error in generateClassReport:", error)
    return { success: false, error: "AI 학급 리포트 생성에 실패했습니다." }
  }
}

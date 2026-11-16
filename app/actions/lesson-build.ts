"use server"

// 판정 결과 → 레시피 고르기 → 빈칸 채우기 (M3). 지문 원문은 저장하지 않는다.
import { createHash } from "node:crypto"
import { loadRecipes } from "@/lib/recipes/load"
import { selectLesson, type SelectionInput, type LessonSet } from "@/lib/recipes/select"
import { fillRecipe, type FilledRecipe } from "@/lib/recipes/fill"
import { checkGenRate, getClientIp } from "@/lib/kcsdb-guard"
import type { Recipe, Stage } from "@/lib/recipes/types"

export interface BuiltLesson {
  ok: true
  passageHash: string
  grade: string
  seed: number
  stages: Record<Stage, FilledRecipe[]>
  minutes: number
  candidates: LessonSet["candidates"]
  builtAt: string
}
export interface BuildError { ok: false; error: string }

const GRADE_KO: Record<string, string> = {
  middle1: "중학교 1학년", middle2: "중학교 2학년", middle3: "중학교 3학년",
  high1: "고등학교 1학년", high2: "고등학교 2학년", high3: "고등학교 3학년",
}

export async function buildLesson(params: {
  text: string
  selection: SelectionInput
}): Promise<BuiltLesson | BuildError> {
  const text = (params.text ?? "").replace(/\r/g, "").trim()
  if (!text) return { ok: false, error: "지문이 없습니다." }

  const ip = await getClientIp()
  if (!(await checkGenRate(ip))) return { ok: false, error: "요청이 잦습니다. 잠시 뒤 다시 시도하세요." }

  try {
    const passageHash = createHash("sha256").update(text).digest("hex")
    // seed 는 지문 해시에서 — 같은 지문·같은 학년이면 같은 세트
    const seed = parseInt(passageHash.slice(0, 8), 16) ^ params.selection.grade.length
    const set = selectLesson(loadRecipes(), params.selection, { seed })
    const gradeKo = GRADE_KO[params.selection.grade] ?? params.selection.grade

    const picked: Array<[Stage, Recipe]> = []
    if (set.pre) picked.push(["pre", set.pre])
    for (const r of set.while) picked.push(["while", r])
    if (set.post) picked.push(["post", set.post])
    for (const r of set.home) picked.push(["home", r])

    const filled = await Promise.all(picked.map(([, r]) => fillRecipe(r, text, gradeKo)))
    const stages: Record<Stage, FilledRecipe[]> = { pre: [], while: [], post: [], home: [] }
    picked.forEach(([stage], i) => stages[stage].push(filled[i]))

    return { ok: true, passageHash, grade: params.selection.grade, seed, stages, minutes: set.minutes,
      candidates: set.candidates, builtAt: new Date().toISOString() }
  } catch (e) {
    console.error("[lesson-build] 실패:", e)
    return { ok: false, error: "활동을 만드는 중 오류가 났습니다." }
  }
}

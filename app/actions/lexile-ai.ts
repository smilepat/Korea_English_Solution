"use server"

import { getLexileTeachingStrategy as getStrategy } from "@/lib/ai"

export async function getLexileTeachingStrategy(params: {
  lexileLevel: string
  language: "ko" | "en"
}): Promise<{
  levelDescription: string
  teachingStrategies: string[]
  recommendedMaterials: string[]
  nextLevelTips: string[]
  studentMessage: string
}> {
  return getStrategy(params)
}

// lib/recipes/types.ts — 레시피 계약의 타입. 정본은 docs/RECIPE-SPEC.md 와 검증기.
import type { Method, Purpose } from "@/lib/text-type/aggregate"
import type { Form } from "@/lib/text-type/forms"

export type Stage = "pre" | "while" | "post" | "home"
export type Grouping = "individual" | "pair" | "group" | "whole"
export type SlotKind = "sentence_list" | "sentence" | "phrase_list" | "word_list" | "question_list" | "text"

export interface Slot {
  key: string
  kind: SlotKind
  n?: number
  from: "passage" | "generated"
  rule: string
}

export interface Recipe {
  id: string
  titleKo: string
  titleEn?: string
  stage: Stage
  skill: "reading" | "writing" | "speaking" | "listening"
  grades: string[]
  minutes: number
  grouping: Grouping
  materials?: string[]
  layer: string
  hooks: { forms: Exclude<Form, "none">[]; purposes: Purpose[]; methods: Method[] }
  slots: Slot[]
  studentText: string
  teacherNote: string
  selfCheck?: string
  source?: { inventoryId?: string; repo?: string }
}

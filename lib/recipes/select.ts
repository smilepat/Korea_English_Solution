// lib/recipes/select.ts — 판정 결과로 레시피를 고른다. AI 없음, 순수 함수.
//
// 파이프라인 ③ "고르는 단계". seed 가 같으면 같은 세트가 나온다 — 같은 지문·같은 학년이면
// 같은 수업. 갈고리가 구체적인 레시피(형식·전개 방식)를 범용보다 먼저 고른다.
import type { Recipe, Stage } from "./types"
import type { Form } from "@/lib/text-type/forms"
import type { Method, Purpose } from "@/lib/text-type/aggregate"

export interface SelectionInput {
  form: Form
  purpose: Purpose | null
  methodsPresent: Method[]
  alwaysOn: Method[]
  grade: string
}

export interface LessonSet {
  pre: Recipe | null
  while: Recipe[]
  post: Recipe | null
  home: Recipe[]
  /** 단계별 후보 수 — 0 이면 그 단계는 범용으로도 못 채웠다는 뜻 */
  candidates: Record<Stage, number>
  minutes: number
}

/** 갈고리 규칙: 비어 있는 갈고리는 묻지 않고, 비어 있지 않은 것은 모두 맞아야 한다(안에서는 하나만). */
export function matches(r: Recipe, a: SelectionInput): boolean {
  if (!r.grades.includes(a.grade)) return false
  const usable = a.methodsPresent.filter((m) => !a.alwaysOn.includes(m))
  const { forms, purposes, methods } = r.hooks
  if (forms.length && !(forms as string[]).includes(a.form)) return false
  if (purposes.length && !(a.purpose && purposes.includes(a.purpose))) return false
  if (methods.length && !methods.some((m) => usable.includes(m))) return false
  return true
}

/** 구체적일수록 높다. 방식·형식 3, 목적 2, 범용 1. */
export function specificity(r: Recipe): number {
  const { forms, purposes, methods } = r.hooks
  let s = 0
  if (methods.length) s += 3
  if (forms.length) s += 3
  if (purposes.length) s += 2
  return s || 1
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** seed 로 섞은 뒤 구체성 내림차순 — 같은 구체성 안에서만 무작위. */
function rank(cands: Recipe[], rnd: () => number): Recipe[] {
  const shuffled = cands.map((r) => ({ r, k: rnd() })).sort((x, y) => x.k - y.k).map((x) => x.r)
  return shuffled.sort((x, y) => specificity(y) - specificity(x))
}

export interface SelectOptions {
  seed?: number
  /** 본 활동(while) 목표 분. 1차시 45분이면 18~25. */
  whileMinutes?: number
  homeCount?: number
}

export function selectLesson(recipes: Recipe[], a: SelectionInput, opts: SelectOptions = {}): LessonSet {
  const rnd = rng(opts.seed ?? 1)
  const target = opts.whileMinutes ?? 20
  const homeCount = opts.homeCount ?? 1
  const byStage = (s: Stage) => rank(recipes.filter((r) => r.stage === s && matches(r, a)), rnd)

  const pre = byStage("pre")
  const whl = byStage("while")
  const post = byStage("post")
  const home = byStage("home")

  // while: 층위가 겹치지 않게, 목표 분에 닿을 때까지, 최대 2개
  const chosenWhile: Recipe[] = []
  const usedLayers = new Set<string>()
  for (const r of whl) {
    if (chosenWhile.length >= 2) break
    if (usedLayers.has(r.layer) && chosenWhile.length) continue
    chosenWhile.push(r); usedLayers.add(r.layer)
    if (chosenWhile.reduce((m, x) => m + x.minutes, 0) >= target) break
  }

  const set: LessonSet = {
    pre: pre[0] ?? null,
    while: chosenWhile,
    post: post.find((r) => !usedLayers.has(r.layer)) ?? post[0] ?? null,
    home: home.slice(0, homeCount),
    candidates: { pre: pre.length, while: whl.length, post: post.length, home: home.length },
    minutes: 0,
  }
  set.minutes = [set.pre, ...set.while, set.post].filter(Boolean).reduce((m, r) => m + r!.minutes, 0)
  return set
}

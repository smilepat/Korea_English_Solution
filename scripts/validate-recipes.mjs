#!/usr/bin/env node
/**
 * 활동 레시피 검증기 — 무의존.
 *
 * lib/ 를 import 하지 않는다. 검증 대상과 코드를 나눠 쓰는 검증기는 공유 코드의 버그를
 * 못 잡는다. 아래 상수는 lib/text-type · lib/recipes 와 일부러 중복이다.
 * 계약 = docs/RECIPE-SPEC.md.  Exit 0 = 전부 통과, 1 = 오류 있음.
 */
import { readdir, readFile } from "node:fs/promises"
import { join, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const DIR = join(ROOT, "content", "recipes")

const STAGES = ["pre", "while", "post", "home"]
const SKILLS = ["reading", "writing", "speaking", "listening"]
const GROUPINGS = ["individual", "pair", "group", "whole"]
const GRADES = ["middle1", "middle2", "middle3", "high1", "high2", "high3"]
const LAYERS = ["fluency", "cohesion", "decode", "anticipation", "structure", "inference", "summary",
  "comprehension-check", "meta", "difficulty-analysis", "diagnosis", "rewrite-awareness", "practice"]
const FORMS = ["letter", "dialogue", "notice", "advertisement"]
const PURPOSES = ["narrative", "social", "informative", "argumentative"]
// 상세화·인과는 뺀다 — 85~100% 의 글에 있어 아무것도 가르지 못한다 (M0 실측)
const METHODS = ["narration", "classification", "definition", "exemplification", "comparison", "contrast", "problem_solution"]
const BANNED_METHODS = ["elaboration", "cause_effect"]
const SLOT_KINDS = ["sentence_list", "sentence", "phrase_list", "word_list", "question_list", "text"]
const SLOT_FROM = ["passage", "generated"]

const MIN_PER_METHOD = 2, MIN_PER_FORM = 1, MIN_PER_PURPOSE = 1, MIN_PER_STAGE = 3, MAX_GENERIC = 6

const errors = [], warnings = []
const err = (p, m) => errors.push(`${p}: ${m}`)
const warn = (p, m) => warnings.push(`${p}: ${m}`)
const isStr = (v) => typeof v === "string" && v.trim().length > 0
const isArr = (v) => Array.isArray(v)

function checkRecipe(r, file) {
  const p = basename(file)
  if (!isStr(r.id)) return err(p, "id 필수")
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.id)) err(p, `id 는 kebab-case: ${r.id}`)
  if (basename(file, ".json") !== r.id) err(p, `파일명이 id 와 다르다 (${r.id})`)
  if (!isStr(r.titleKo)) err(p, "titleKo 필수")
  if (!STAGES.includes(r.stage)) err(p, `stage 는 ${STAGES.join("|")}`)
  if (!SKILLS.includes(r.skill)) err(p, `skill 은 ${SKILLS.join("|")}`)
  if (!isArr(r.grades) || r.grades.length === 0) err(p, "grades 1개 이상")
  else for (const g of r.grades) if (!GRADES.includes(g)) err(p, `모르는 학년 ${g}`)
  if (!Number.isInteger(r.minutes) || r.minutes < 3 || r.minutes > 25) err(p, "minutes 는 3~25 정수")
  if (!GROUPINGS.includes(r.grouping)) err(p, `grouping 은 ${GROUPINGS.join("|")}`)
  if (!LAYERS.includes(r.layer)) err(p, `layer 는 activity-inventory 13 층위 중 하나: ${r.layer}`)
  if (!isStr(r.studentText)) err(p, "studentText 필수")
  if (!isStr(r.teacherNote)) err(p, "teacherNote 필수")

  // hooks
  const h = r.hooks
  if (!h || typeof h !== "object") err(p, "hooks 필수")
  else {
    for (const k of ["forms", "purposes", "methods"]) if (!isArr(h[k])) err(p, `hooks.${k} 는 배열이어야 한다 (빈 배열 허용)`)
    for (const f of h.forms ?? []) if (!FORMS.includes(f)) err(p, `모르는 form ${f}`)
    for (const u of h.purposes ?? []) if (!PURPOSES.includes(u)) err(p, `모르는 purpose ${u}`)
    for (const m of h.methods ?? []) {
      if (BANNED_METHODS.includes(m)) err(p, `hooks.methods 에 ${m} 은 못 넣는다 — 거의 모든 글에 있어 변별이 없다`)
      else if (!METHODS.includes(m)) err(p, `모르는 method ${m}`)
    }
  }

  // slots
  if (!isArr(r.slots)) err(p, "slots 는 배열 (빈 배열 허용)")
  else {
    const keys = new Set()
    for (const [i, s] of r.slots.entries()) {
      const sp = `${p}.slots[${i}]`
      if (!isStr(s.key)) err(sp, "key 필수")
      else if (keys.has(s.key)) err(sp, `key 중복 ${s.key}`)
      else keys.add(s.key)
      if (!SLOT_KINDS.includes(s.kind)) err(sp, `kind 는 ${SLOT_KINDS.join("|")}`)
      if (!SLOT_FROM.includes(s.from)) err(sp, `from 은 passage|generated`)
      if (s.kind.endsWith("_list") && !(Number.isInteger(s.n) && s.n >= 1)) err(sp, "_list 는 n 필수")
      if (!isStr(s.rule)) err(sp, "rule 필수 — AI 가 무엇을 채워야 하는지")
    }
    // studentText 가 참조하는 {{key…}} 가 실제 slot 인지
    for (const m of String(r.studentText ?? "").matchAll(/\{\{([a-zA-Z0-9_]+)(?:\.[a-z]+)?\}\}/g))
      if (!keys.has(m[1])) err(p, `studentText 가 없는 slot 을 참조: ${m[1]}`)
  }

  // 숙제
  if (r.stage === "home") {
    if (r.grouping !== "individual") err(p, "숙제는 grouping=individual — 짝·모둠은 숙제가 못 된다")
    if (!isStr(r.selfCheck)) err(p, "숙제는 selfCheck 필수 — 학생이 혼자 확인하는 방법")
  }
}

async function main() {
  let files
  try { files = (await readdir(DIR)).filter((f) => f.endsWith(".json")).sort() }
  catch { console.error(`❌ 레시피 디렉터리 없음: ${DIR}`); process.exit(1) }
  if (files.length === 0) { console.error("❌ content/recipes/ 에 레시피가 없다"); process.exit(1) }

  const recipes = []
  const ids = new Set()
  for (const f of files) {
    let r
    try { r = JSON.parse(await readFile(join(DIR, f), "utf8")) }
    catch (e) { err(f, `JSON 파싱 실패: ${e.message}`); continue }
    if (ids.has(r.id)) err(f, `id 중복 ${r.id}`)
    ids.add(r.id)
    checkRecipe(r, f)
    recipes.push(r)
  }

  // 합격선 — 커버리지
  const count = (pred) => recipes.filter(pred).length
  for (const m of METHODS) {
    const c = count((r) => r.hooks?.methods?.includes(m))
    if (c < MIN_PER_METHOD) err("coverage", `전개 방식 ${m} 레시피 ${c}개 < ${MIN_PER_METHOD}`)
  }
  for (const f of FORMS) {
    const c = count((r) => r.hooks?.forms?.includes(f))
    if (c < MIN_PER_FORM) err("coverage", `형식 ${f} 레시피 ${c}개 < ${MIN_PER_FORM}`)
  }
  for (const u of PURPOSES) {
    const c = count((r) => r.hooks?.purposes?.includes(u))
    if (c < MIN_PER_PURPOSE) err("coverage", `목적 ${u} 레시피 ${c}개 < ${MIN_PER_PURPOSE}`)
  }
  for (const s of STAGES) {
    const c = count((r) => r.stage === s)
    if (c < MIN_PER_STAGE) err("coverage", `단계 ${s} 레시피 ${c}개 < ${MIN_PER_STAGE}`)
  }
  const generic = count((r) => r.hooks && !r.hooks.forms?.length && !r.hooks.purposes?.length && !r.hooks.methods?.length)
  if (generic > MAX_GENERIC) err("coverage", `범용 레시피 ${generic}개 > ${MAX_GENERIC} — 많으면 유형 판정이 장식이 된다`)

  console.log(`레시피 ${recipes.length}개 · 범용 ${generic}개`)
  for (const w of warnings) console.warn(`  ⚠ ${w}`)
  if (errors.length) {
    console.error(`\n❌ 오류 ${errors.length}건`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log("✅ 레시피 계약 통과")
}

main()

// scripts/classify-grammar.mjs
// kcsdb_grammar 40개 영어 예문을 Gemini로 분류 → item_name_ko(한국어 문법 항목명)·category.
// ⚠️ LLM 분류물(검수 권장). label_source='llm' 로 표기. 40건이라 사람 전수 검토 가능.
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path"
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const env = {}; if (existsSync(join(ROOT, ".env.local"))) for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2] }
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: (env.TURSO_AUTH_TOKEN || "").replace(/[^A-Za-z0-9._-]/g, "") })
const KEY = env.GEMINI_API_KEY

async function gen(p) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: p }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 4096 } }),
  })
  return (await r.json()).candidates[0].content.parts[0].text
}

// 사람 전수 검수 오버라이드(정본화). data/kcsdb/grammar_verified.csv 있으면 우선 적용,
// 해당 항목은 LLM 재분류를 건너뛰고 label_source='verified' 로 표기(예문은 [별표4] 정본).
function loadVerified() {
  const p = join(ROOT, "data", "kcsdb", "grammar_verified.csv")
  if (!existsSync(p)) return new Map()
  const lines = readFileSync(p, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean)
  const map = new Map()
  for (const line of lines.slice(1)) {
    // id,category,item_name_ko  — item_name_ko 에 쉼표 없음(현 데이터). 앞 2개만 split.
    const i1 = line.indexOf(","); const i2 = line.indexOf(",", i1 + 1)
    if (i1 < 0 || i2 < 0) continue
    const id = line.slice(0, i1).trim()
    const category = line.slice(i1 + 1, i2).trim()
    const item = line.slice(i2 + 1).trim().replace(/^"|"$/g, "")
    if (id && item) map.set(id, { category: category || null, item })
  }
  return map
}

async function main() {
  try { await db.execute("ALTER TABLE kcsdb_grammar ADD COLUMN item_name_ko TEXT") } catch {}
  try { await db.execute("ALTER TABLE kcsdb_grammar ADD COLUMN category TEXT") } catch {}
  try { await db.execute("ALTER TABLE kcsdb_grammar ADD COLUMN label_source TEXT") } catch {}

  const verified = loadVerified()
  if (verified.size) {
    let v = 0
    for (const [id, o] of verified) {
      await db.execute({ sql: "UPDATE kcsdb_grammar SET item_name_ko=?, category=?, label_source='verified' WHERE id=?", args: [o.item, o.category, id] })
      v++
    }
    console.log(`[grammar] ${v} 검수 오버라이드 적용(label_source=verified)`)
  }

  // 검수되지 않은 나머지만 LLM 분류 대상.
  const rows = (await db.execute("SELECT id, example_en FROM kcsdb_grammar WHERE id NOT IN (SELECT id FROM kcsdb_grammar WHERE label_source='verified') ORDER BY id")).rows
  if (!rows.length) {
    console.log("[grammar] 전 항목 검수 완료 — LLM 분류 생략")
    for (const c of (await db.execute("SELECT category, COUNT(*) n FROM kcsdb_grammar WHERE category IS NOT NULL GROUP BY 1 ORDER BY 2 DESC")).rows)
      console.log(`   ${c.category}: ${c.n}`)
    process.exit(0)
  }
  const GROUPS = "문장구조|시제|조동사|관계사|준동사|가정법|비교|수동태|접속사·연결|대명사·한정사|전치사|화법·의문|기타"
  let n = 0
  for (let b = 0; b < rows.length; b += 20) {
    const chunk = rows.slice(b, b + 20)
    const list = chunk.map((r, i) => `${b + i}. ${r.example_en}`).join("\n")
    const prompt = `대한민국 영어 교육과정 [별표4] 언어 형식 예문을 문법 항목으로 분류하라.
각 예문에 대해 두 필드를 판정:
- "item": 그 예문이 보여주는 **구체적 문법 항목명(한국어 표준 문법 용어)**. 절대 영어 문장을 그대로 쓰지 말 것. 예: "be동사 현재형", "현재완료", "관계대명사 who", "to부정사(명사적 용법)", "수동태", "비교급".
- "group": 대범주 하나. (${GROUPS})
worked example: 입력 "Kate is from London." → {"i":0,"item":"be동사 현재형","group":"문장구조"}
입력 "I have lived here for 5 years." → {"item":"현재완료","group":"시제"}
출력은 JSON 배열만(코드펜스·설명 없이):
${list}`
    const raw = await gen(prompt)
    let arr = []
    try { arr = JSON.parse((raw.replace(/```json|```/g, "").match(/\[[\s\S]*\]/) || ["[]"])[0]) } catch (e) { console.log("  파싱실패 batch", b, e.message.slice(0, 40)); continue }
    for (let j = 0; j < arr.length; j++) {
      const item = arr[j]
      const r = (typeof item.i === "number" ? rows[item.i] : chunk[j]) || chunk[j]
      const name = item.item || item.name
      if (!r || !name) continue
      await db.execute({ sql: "UPDATE kcsdb_grammar SET item_name_ko=?, category=?, label_source='llm' WHERE id=?", args: [String(name), item.group || item.category || null, r.id] })
      n++
    }
  }
  console.log(`[grammar] ${n}/${rows.length} 분류(LLM)`)
  for (const c of (await db.execute("SELECT category, COUNT(*) n FROM kcsdb_grammar WHERE category IS NOT NULL GROUP BY 1 ORDER BY 2 DESC")).rows)
    console.log(`   ${c.category}: ${c.n}`)
  console.log("샘플:", (await db.execute("SELECT item_name_ko, substr(example_en,1,30) e FROM kcsdb_grammar WHERE item_name_ko IS NOT NULL LIMIT 6")).rows.map(r => `${r.item_name_ko}(${r.e})`).join(", "))
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })

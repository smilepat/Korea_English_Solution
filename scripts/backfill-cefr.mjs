// scripts/backfill-cefr.mjs
// CEFR 결측(338/672) 백필: 같은 학년군·영역 보유분에서 최빈 CEFR 상속 → 없으면 학년군 기본값.
// cefr_source 컬럼으로 출처 구분(original|inherited|estimated). UI에서 "추정" 표기.
import { createClient } from "@libsql/client"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path"
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const env = {}; if (existsSync(join(ROOT, ".env.local"))) for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2] }
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: (env.TURSO_AUTH_TOKEN || "").replace(/[^A-Za-z0-9._-]/g, "") })
const Q = async (s, a = []) => (await db.execute({ sql: s, args: a })).rows

const BAND_DEFAULT = { elementary: "A1", middle: "A2", high: "B1" }

async function main() {
  // 1) cefr_source 컬럼(없으면 추가)
  try { await db.execute("ALTER TABLE kcsdb_standards ADD COLUMN cefr_source TEXT") } catch { /* 이미 있음 */ }
  await db.execute("UPDATE kcsdb_standards SET cefr_source='original' WHERE cefr_alignment IS NOT NULL AND cefr_alignment!='' AND (cefr_source IS NULL OR cefr_source='')")

  // 2) 결측 목록
  const missing = await Q("SELECT standard_id, curriculum_version, grade_band, domain_name_ko FROM kcsdb_standards WHERE cefr_alignment IS NULL OR cefr_alignment=''")
  console.log(`[backfill] 결측 ${missing.length}건 처리...`)

  // 3) (version,band,domain) 최빈 CEFR 캐시
  const modeCache = new Map()
  async function majority(v, b, d) {
    const key = `${v}|${b}|${d}`
    if (modeCache.has(key)) return modeCache.get(key)
    const r = await Q(`SELECT cefr_alignment c FROM kcsdb_standards WHERE curriculum_version=? AND grade_band=? AND domain_name_ko=? AND cefr_alignment!='' GROUP BY cefr_alignment ORDER BY COUNT(*) DESC LIMIT 1`, [v, b, d])
    const val = r[0]?.c || null; modeCache.set(key, val); return val
  }

  let inherited = 0, estimated = 0
  for (const m of missing) {
    let cefr = await majority(m.curriculum_version, m.grade_band, m.domain_name_ko)
    let src = "inherited"
    if (!cefr) { cefr = BAND_DEFAULT[m.grade_band] || "B1"; src = "estimated" }
    await db.execute({ sql: "UPDATE kcsdb_standards SET cefr_alignment=?, cefr_source=? WHERE standard_id=?", args: [cefr, src, m.standard_id] })
    if (src === "inherited") inherited++; else estimated++
  }
  console.log(`[backfill] 완료: 상속 ${inherited} · 추정(학년군기본값) ${estimated}`)

  // 4) 고교 과목별 CEFR 정교화(overlay). data/kcsdb/cefr_hs_refine.csv 근거표 기반.
  //    학년군 기본값(high→B1) 일괄추정을 과목 성격에 맞게 A2/B2로 조정하거나
  //    동일 과목 원본이 있으면 상속으로 승격. 원본(original)은 절대 덮지 않는다.
  const refinePath = join(ROOT, "data", "kcsdb", "cefr_hs_refine.csv")
  if (existsSync(refinePath)) {
    const lines = readFileSync(refinePath, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean)
    let refined = 0
    for (const line of lines.slice(1)) {
      const [ver, subj, cefr, src] = line.split(",")  // rationale(5번째)는 문서용, 미사용
      if (!ver || !subj || !cefr) continue
      const r = await db.execute({
        // 자동 추정(estimated) 또는 이전 정교화(inherited) 대상만 갱신 → original 보호, 재실행 멱등
        sql: "UPDATE kcsdb_standards SET cefr_alignment=?, cefr_source=? WHERE curriculum_version=? AND subject_name_ko=? AND grade_band='high' AND cefr_source!='original'",
        args: [cefr.trim(), src.trim(), ver.trim(), subj.trim()],
      })
      refined += r.rowsAffected || 0
    }
    console.log(`[backfill] 과목별 정교화(overlay): ${refined}행 갱신`)
  }

  for (const r of await Q("SELECT cefr_source, COUNT(*) n FROM kcsdb_standards GROUP BY cefr_source"))
    console.log(`   ${r.cefr_source}: ${r.n}`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })

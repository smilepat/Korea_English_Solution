// lib/text-type/standards.ts — 성취기준 후보. verified 만, 문구는 DB 원문 그대로.
//
// AI 는 여기서 문장을 쓰지 않는다. 후보 중에서 고르는 일만 한다(그것도 M2 이후).
// needs_review 행은 고시문과 다르다(Korea-curri-standards-db 이슈 #3) — SQL 에서 막는다.
import { turso } from "@/lib/turso"

export interface StandardCandidate {
  id: string
  text: string          // standard_text_ko 원문
  gradeBand: string
  domain: string
  curriculum: string
  cefr: string | null
}

const KES_TO_BAND: Record<string, string> = {
  elementary3: "elementary", elementary4: "elementary", elementary5: "elementary", elementary6: "elementary",
  middle1: "middle", middle2: "middle", middle3: "middle",
  high1: "high", high2: "high", high3: "high",
}

/**
 * 읽기·이해 영역의 verified 성취기준. 2022 개정은 '이해'(듣기+읽기 통합), 2015 는 '읽기'.
 * 전개 방식을 다루는 성취기준([…-01-06] 류)을 앞에 둔다 — 축 B 활동이 곧 그 도달 활동이다.
 */
export async function readingStandards(grade: string, limit = 30): Promise<StandardCandidate[]> {
  const band = KES_TO_BAND[grade]
  if (!band) return []
  const r = await turso.execute({
    sql: `SELECT standard_id, standard_text_ko, grade_band, domain_name_ko, curriculum_version, cefr_alignment
          FROM kcsdb_standards
          WHERE verification_status = 'verified'
            AND grade_band = ?
            AND domain_name_ko IN ('읽기', '이해')
          ORDER BY CASE WHEN standard_text_ko LIKE '%전개 방식%' OR standard_text_ko LIKE '%구조%' THEN 0 ELSE 1 END,
                   curriculum_version DESC, standard_id
          LIMIT ?`,
    args: [band, limit],
  })
  return r.rows.map((row) => ({
    id: String(row.standard_id),
    text: String(row.standard_text_ko),
    gradeBand: String(row.grade_band),
    domain: String(row.domain_name_ko),
    curriculum: String(row.curriculum_version),
    cefr: row.cefr_alignment ? String(row.cefr_alignment) : null,
  }))
}

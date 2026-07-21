// scripts/check-no-kichul.mjs
// 저작권 방화벽 CI 가드 — 워크시트 지문 풀에 수능/모의고사 기출 문항이
// 새어들지 않았는지 검사한다.
//
// 정밀도가 관건이다: "Pre-CSAT" 같은 난이도 라벨은 기출이 아니다. 진짜 위험은
// 기출 "문항"(지문+선택지+정답+출제연도) 구조다. 따라서 substring "csat" 가
// 아니라, 지문 스냅샷에 문항 구조 필드가 섞였는지를 본다.
//
// 실행: node scripts/check-no-kichul.mjs   (exit 1 = 위반)
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, "..")

const PASSAGE_DIR = join(ROOT, "data", "passages")

// 지문 레코드에 있어선 안 되는 "문항/기출" 구조 필드.
// 지문은 본문 텍스트일 뿐, 정답·선택지·출제정보를 가지면 안 된다.
const FORBIDDEN_FIELDS = [
  "options",
  "answer",
  "correct_answer",
  "exam_year",
  "exam_session",
  "question_number",
  "distractors",
  "choices",
]

// 허용되는 소스/라이선스 화이트리스트
const ALLOWED_LICENSE = new Set(["original", "kogl", "generated"])
const ALLOWED_SOURCE_PREFIX = ["lexile_textdb_original", "ai-generated"]

if (!existsSync(PASSAGE_DIR)) {
  console.log("✓ 지문 스냅샷 없음 — 검사 생략 (아직 export 안 함)")
  process.exit(0)
}

// data/passages 아래 모든 *.jsonl 스냅샷을 검사한다(창작 지문 + AI 생성 지문 lane).
const files = existsSync(PASSAGE_DIR)
  ? readdirSync(PASSAGE_DIR).filter((f) => f.endsWith(".jsonl"))
  : []

const violations = []
let totalLines = 0

for (const file of files) {
  const lines = readFileSync(join(PASSAGE_DIR, file), "utf8").split(/\r?\n/).filter(Boolean)
  totalLines += lines.length
  lines.forEach((line, i) => {
    let o
    try {
      o = JSON.parse(line)
    } catch {
      violations.push(`${file}:${i + 1}: JSON 파싱 실패`)
      return
    }
    // 1) 금지 구조 필드
    for (const f of FORBIDDEN_FIELDS) {
      if (f in o) violations.push(`${file}:${i + 1}: 문항 구조 필드 '${f}' 감지 (기출 유입 의심)`)
    }
    // 2) 라이선스 화이트리스트
    if (!ALLOWED_LICENSE.has(o.license)) {
      violations.push(`${file}:${i + 1}: 허용되지 않은 license '${o.license}' (text_id=${o.text_id})`)
    }
    // 3) 소스 화이트리스트
    if (!ALLOWED_SOURCE_PREFIX.some((p) => String(o.source || "").startsWith(p))) {
      violations.push(`${file}:${i + 1}: 허용되지 않은 source '${o.source}' (text_id=${o.text_id})`)
    }
  })
}

if (violations.length > 0) {
  console.error("✗ 저작권 방화벽 위반 — 워크시트 지문 풀에 기출/미허가 콘텐츠 의심:\n")
  for (const v of violations.slice(0, 20)) console.error(`  ${v}`)
  if (violations.length > 20) console.error(`  … 외 ${violations.length - 20}건`)
  process.exit(1)
}

console.log(
  `✓ 지문 ${totalLines}개 (${files.length} 파일) — 기출 문항 구조 없음, license/source 전부 화이트리스트`,
)

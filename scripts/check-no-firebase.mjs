// scripts/check-no-firebase.mjs
// Firestore 격리 정책을 CI 에서 영구 강제한다.
//
// 배경: 이전 프로젝트(usb_csat)에서 Firestore 어댑터의 async/sync 불일치로
// 179곳의 라우트가 깨진 사고가 있었다. 이 앱은 Turso 단일 백엔드로 통일했고,
// firebase 가 다시 기어들어오는 것을 사람 리뷰에 의존하지 않고 막는다.
//
// 실행: node scripts/check-no-firebase.mjs   (exit 1 = 위반)
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, relative, sep } from "node:path"

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, "..")

const SCAN_DIRS = ["app", "lib", "components", "scripts", "hooks"]
const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build"])
const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/

// 이 파일 자신은 검사 대상에서 제외한다 (금지어를 문서화하고 있으므로).
const SELF = fileURLToPath(import.meta.url)

// 실제 코드 의존성만 잡는다. 주석 안의 "firebase" 언급은 허용
// (왜 금지했는지 설명하는 주석까지 막으면 지식이 사라진다).
const VIOLATION = /(?:from\s+['"]firebase|require\(\s*['"]firebase|@\/lib\/firebase|firebase-admin)/

const violations = []

function walk(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full)
    } else if (CODE_EXT.test(entry) && full !== SELF) {
      const lines = readFileSync(full, "utf8").split(/\r?\n/)
      lines.forEach((line, i) => {
        // 한 줄 주석은 건너뛴다
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
        if (VIOLATION.test(line)) {
          violations.push(`${relative(ROOT, full).split(sep).join("/")}:${i + 1}: ${line.trim()}`)
        }
      })
    }
  }
}

for (const d of SCAN_DIRS) {
  const p = join(ROOT, d)
  if (existsSync(p)) walk(p)
}

// package.json 의존성도 검사한다
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
for (const field of ["dependencies", "devDependencies"]) {
  for (const dep of Object.keys(pkg[field] ?? {})) {
    if (/^firebase/.test(dep)) {
      violations.push(`package.json:${field}.${dep}`)
    }
  }
}

if (violations.length > 0) {
  console.error("✗ Firestore 격리 정책 위반 — Turso 단일 백엔드 원칙을 지키세요:\n")
  for (const v of violations) console.error(`  ${v}`)
  console.error("\n영속화는 lib/turso.ts 를 통해서만 합니다.")
  process.exit(1)
}

console.log("✓ firebase 의존성 없음 (Firestore 격리 정책 준수)")

// ============================================================
// 명부 CSV 파서 — 순수 함수 (I/O 없음, 테스트 대상)
//
// 교사가 엑셀/구글시트에서 내보낸 CSV 를 받는다. 한국 교사의 실제 파일은
//  - 헤더가 한글("이름","번호","학번")일 수 있고
//  - 번호가 없을 수 있고
//  - 이름에 공백이, 학번에 앞자리 0 이 있을 수 있다(문자열 보존 필수).
// ============================================================

export interface RosterRow {
  name: string
  number: string | null // 학번/출석번호 — 앞자리 0 보존 위해 문자열
  seatNo: number | null // 정렬용. number 가 숫자면 파생, 아니면 행 순서
}

// 헤더 별칭. 소문자·공백제거 후 매칭.
const NAME_KEYS = ["name", "이름", "성명", "학생", "student", "studentname"]
const NUMBER_KEYS = ["number", "번호", "학번", "출석번호", "no", "num", "studentnumber", "seat"]

/** seed-kcsdb.mjs 와 동일한 RFC4180 파서(따옴표 안 콤마·개행 처리). */
function parseCsvGrid(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  // BOM 제거
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      row.push(field)
      field = ""
    } else if (c === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (c === "\r") {
      // \r\n 의 \r 은 무시 (다음 \n 이 행을 끝냄)
    } else {
      field += c
    }
  }
  // 마지막 필드/행
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "")
}

/**
 * 명부 CSV → RosterRow[].
 * 헤더 행이 있으면 별칭으로 name/number 열을 찾는다.
 * 헤더가 없으면 1열=이름, 2열=번호로 간주한다.
 * 이름이 빈 행은 조용히 건너뛰지 않고 에러를 던진다(누락은 최악의 실패).
 */
export function parseRosterCsv(csvText: string): RosterRow[] {
  const grid = parseCsvGrid(csvText).filter((r) => r.some((c) => c.trim() !== ""))
  if (grid.length === 0) return []

  const header = grid[0].map(normalizeHeader)
  const hasHeader =
    header.some((h) => NAME_KEYS.includes(h)) || header.some((h) => NUMBER_KEYS.includes(h))

  let nameIdx = 0
  let numberIdx = 1
  let dataRows = grid

  if (hasHeader) {
    nameIdx = header.findIndex((h) => NAME_KEYS.includes(h))
    numberIdx = header.findIndex((h) => NUMBER_KEYS.includes(h))
    if (nameIdx === -1) {
      throw new Error("CSV 에 이름(name/이름) 열이 없습니다.")
    }
    dataRows = grid.slice(1)
  }

  const out: RosterRow[] = []
  dataRows.forEach((cells, i) => {
    const name = (cells[nameIdx] ?? "").trim()
    if (!name) {
      throw new Error(`${i + 1}번째 학생 행에 이름이 비어 있습니다. CSV 를 확인하세요.`)
    }
    const rawNumber = numberIdx >= 0 ? (cells[numberIdx] ?? "").trim() : ""
    const number = rawNumber || null
    // 번호가 순수 숫자면 좌석 정렬 키로도 쓴다
    const seatNo = number && /^\d+$/.test(number) ? Number(number) : null
    out.push({ name, number, seatNo })
  })

  return out
}

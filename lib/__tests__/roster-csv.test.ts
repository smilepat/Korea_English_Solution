import { describe, it, expect } from "vitest"
import { parseRosterCsv } from "../roster-csv"

describe("parseRosterCsv", () => {
  it("영문 헤더 CSV 를 파싱한다", () => {
    const rows = parseRosterCsv("name,number\nMinjun Kim,1\nSeoyeon Lee,2")
    expect(rows).toEqual([
      { name: "Minjun Kim", number: "1", seatNo: 1 },
      { name: "Seoyeon Lee", number: "2", seatNo: 2 },
    ])
  })

  it("한글 헤더(이름/번호)를 인식한다", () => {
    const rows = parseRosterCsv("이름,번호\n김민준,1\n이서연,2")
    expect(rows.map((r) => r.name)).toEqual(["김민준", "이서연"])
    expect(rows.map((r) => r.seatNo)).toEqual([1, 2])
  })

  it("학번 별칭과 앞자리 0 을 문자열로 보존한다", () => {
    const rows = parseRosterCsv("이름,학번\n김민준,0101\n이서연,0102")
    expect(rows[0].number).toBe("0101") // Number 로 변환하면 101 이 되어버린다
    expect(rows[1].number).toBe("0102")
  })

  it("헤더가 없으면 1열=이름, 2열=번호로 본다", () => {
    const rows = parseRosterCsv("김민준,1\n이서연,2")
    expect(rows[0]).toEqual({ name: "김민준", number: "1", seatNo: 1 })
  })

  it("번호 열이 없어도 이름만으로 등록된다", () => {
    const rows = parseRosterCsv("이름\n김민준\n이서연")
    expect(rows.map((r) => r.name)).toEqual(["김민준", "이서연"])
    expect(rows[0].number).toBeNull()
    expect(rows[0].seatNo).toBeNull()
  })

  it("따옴표 안의 콤마를 이름의 일부로 보존한다", () => {
    const rows = parseRosterCsv('name,number\n"Kim, Minjun",1')
    expect(rows[0].name).toBe("Kim, Minjun")
  })

  it("빈 줄과 공백 행을 건너뛴다", () => {
    const rows = parseRosterCsv("이름,번호\n김민준,1\n\n   \n이서연,2")
    expect(rows).toHaveLength(2)
  })

  it("BOM 이 붙은 엑셀 CSV 를 처리한다", () => {
    const rows = parseRosterCsv("﻿이름,번호\n김민준,1")
    expect(rows[0].name).toBe("김민준")
  })

  it("CRLF 줄바꿈을 처리한다", () => {
    const rows = parseRosterCsv("이름,번호\r\n김민준,1\r\n이서연,2")
    expect(rows).toHaveLength(2)
  })

  it("이름이 빈 행은 조용히 넘기지 않고 실패시킨다 — 누락이 최악의 실패이므로", () => {
    expect(() => parseRosterCsv("이름,번호\n김민준,1\n,2")).toThrow(/이름이 비어/)
  })

  it("빈 입력은 빈 배열이다", () => {
    expect(parseRosterCsv("")).toEqual([])
    expect(parseRosterCsv("   \n  ")).toEqual([])
  })
})

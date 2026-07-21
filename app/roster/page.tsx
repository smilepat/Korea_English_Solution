"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UploadCloud,
  Printer,
  Loader2,
  GraduationCap,
  KeyRound,
  ArrowLeft,
} from "lucide-react"
import { getClasses } from "@/app/actions/students"
import {
  importRosterCsv,
  getClassRoster,
  type ClassRoster,
} from "@/app/actions/roster"

// 초·중·고를 전부 가르치므로 학교급은 반마다 명시적으로 고른다(기본값 없음).
const GRADE_BANDS = [
  { value: "elementary", label: "초등학교" },
  { value: "middle", label: "중학교" },
  { value: "high", label: "고등학교" },
]

const BAND_LABEL: Record<string, string> = {
  elementary: "초등",
  middle: "중등",
  high: "고등",
}

interface ClassSummary {
  id: string
  name: string
  gradeBand: string
  gradeLabel: string
  classCode: string
  schoolYear: number
  studentCount: number
}

export default function RosterPage() {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [selected, setSelected] = useState<ClassRoster | null>(null)
  const [loading, setLoading] = useState(false)

  // 등록 폼 상태
  const [className, setClassName] = useState("")
  const [gradeBand, setGradeBand] = useState("")
  const [gradeLabel, setGradeLabel] = useState("")
  const [csvText, setCsvText] = useState("")
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  const loadClasses = useCallback(async () => {
    setLoading(true)
    const data = await getClasses()
    setClasses(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  async function handleImport() {
    setMessage(null)
    if (!className.trim()) {
      setMessage({ kind: "err", text: "반 이름을 입력하세요." })
      return
    }
    if (!gradeBand) {
      setMessage({ kind: "err", text: "학교급(초/중/고)을 선택하세요." })
      return
    }
    if (!csvText.trim()) {
      setMessage({ kind: "err", text: "명부 CSV 를 붙여넣으세요. (헤더: 이름, 번호)" })
      return
    }

    setImporting(true)
    const res = await importRosterCsv({
      className: className.trim(),
      gradeBand,
      gradeLabel: gradeLabel.trim() || undefined,
      csvText,
    })
    setImporting(false)

    if (res.success) {
      setMessage({
        kind: "ok",
        text: `"${className}" 등록 완료 — 학생 ${res.count}명, 반 코드 ${res.classCode}`,
      })
      setClassName("")
      setGradeBand("")
      setGradeLabel("")
      setCsvText("")
      await loadClasses()
      if (res.classId) await openClass(res.classId)
    } else {
      setMessage({ kind: "err", text: res.error ?? "등록 실패" })
    }
  }

  async function openClass(classId: string) {
    const roster = await getClassRoster(classId)
    setSelected(roster)
    if (roster) {
      // 인쇄 미리보기로 스크롤
      setTimeout(() => {
        document.getElementById("join-cards")?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 인쇄 시 화면 UI 를 숨기고 조인 카드만 남긴다 */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #join-cards { margin: 0 !important; }
          .join-card {
            break-inside: avoid;
            border: 1px dashed #94a3b8 !important;
          }
        }
        @page { margin: 12mm; }
      `}</style>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="no-print mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> 홈
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <Users className="h-6 w-6 text-teal-600" /> 학급 명부
            </h1>
            <p className="text-sm text-slate-500">
              명부를 한 번 등록하면 진단·과제·성장기록이 모두 이 학생들에게 쌓입니다.
            </p>
          </div>
        </div>

        {/* ── 등록 폼 ── */}
        <Card className="no-print mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UploadCloud className="h-5 w-5 text-teal-600" /> 명부 CSV 등록
            </CardTitle>
            <CardDescription>
              엑셀/구글시트에서 이름·번호 두 열을 복사해 붙여넣으세요. 헤더는 한글(이름, 번호)도 인식합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="className">반 이름</Label>
                <Input
                  id="className"
                  placeholder="예: 2학년 3반"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>학교급</Label>
                <Select value={gradeBand} onValueChange={setGradeBand}>
                  <SelectTrigger>
                    <SelectValue placeholder="초 / 중 / 고" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_BANDS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gradeLabel">학년 표기 (선택)</Label>
                <Input
                  id="gradeLabel"
                  placeholder="예: 중2, 고1"
                  value={gradeLabel}
                  onChange={(e) => setGradeLabel(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="csv">명부 CSV</Label>
              <Textarea
                id="csv"
                rows={6}
                className="font-mono text-xs"
                placeholder={"이름,번호\n김민준,1\n이서연,2\n박지호,3"}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>

            {message && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  message.kind === "ok"
                    ? "bg-teal-50 text-teal-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message.text}
              </div>
            )}

            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              등록하고 조인 카드 만들기
            </Button>
          </CardContent>
        </Card>

        {/* ── 반 목록 ── */}
        <div className="no-print mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-700">등록된 반</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
            </div>
          ) : classes.length === 0 ? (
            <p className="text-sm text-slate-400">아직 등록된 반이 없습니다. 위에서 CSV 로 등록하세요.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <Card
                  key={c.id}
                  className="cursor-pointer transition hover:border-teal-400 hover:shadow-md"
                  onClick={() => openClass(c.id)}
                >
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <Badge variant="secondary">{BAND_LABEL[c.gradeBand] ?? c.gradeBand}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" /> {c.studentCount}명
                      </span>
                      <span className="flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5" /> 반코드 {c.classCode}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── 조인 카드 (인쇄 대상) ── */}
        {selected && (
          <div id="join-cards">
            <div className="no-print mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-700">
                  {selected.className} 조인 카드
                </h2>
                <p className="text-sm text-slate-500">
                  반 코드 <span className="font-mono font-bold">{selected.classCode}</span> ·
                  학생 {selected.students.length}명 — 잘라서 나눠주세요.
                </p>
              </div>
              <Button onClick={() => window.print()} variant="outline">
                <Printer className="mr-2 h-4 w-4" /> 인쇄
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selected.students.map((s) => (
                <div
                  key={s.studentId}
                  className="join-card rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 text-xs text-slate-400">
                    {selected.className}
                    {s.seatNo != null && ` · ${s.seatNo}번`}
                  </div>
                  <div className="mb-3 text-lg font-bold text-slate-800">{s.name}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">반 코드</span>
                      <span className="font-mono font-bold tracking-widest text-slate-800">
                        {selected.classCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">내 토큰</span>
                      <span className="font-mono font-bold tracking-widest text-teal-700">
                        {s.joinToken}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

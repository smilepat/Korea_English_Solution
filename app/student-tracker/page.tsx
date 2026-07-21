"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Loader2,
  Sparkles,
  UserPlus,
  Trash2,
  Save,
  BarChart3,
  BookOpen,
  GraduationCap,
  Download,
} from "lucide-react"
import Link from "next/link"
import { exportToPDF } from "@/lib/pdf-export"
import {
  addStudent,
  getStudents,
  updateStudentLexile,
  updateStudentSkill,
  deleteStudent,
  generateStudentPrescription,
  generateClassReport,
  type Student,
  type Prescription,
  type ClassReport,
} from "@/app/actions/students"
import {
  prescribeWordlistAssignment,
  getStudentStandardMastery,
  type StandardMastery,
} from "@/app/actions/assignments"

// ============================================================
// Constants
// ============================================================

const GRADES = [
  { value: "1", label: "1학년" },
  { value: "2", label: "2학년" },
  { value: "3", label: "3학년" },
  { value: "4", label: "4학년" },
  { value: "5", label: "5학년" },
  { value: "6", label: "6학년" },
]

const CLASSES = [
  { value: "1", label: "1반" },
  { value: "2", label: "2반" },
  { value: "3", label: "3반" },
  { value: "4", label: "4반" },
  { value: "5", label: "5반" },
  { value: "6", label: "6반" },
  { value: "7", label: "7반" },
  { value: "8", label: "8반" },
]

const CEFR_LEVELS = ["A1", "A2", "B1", "B2"]

const SKILL_LABELS: Record<string, string> = {
  reading: "읽기",
  writing: "쓰기",
  listening: "듣기",
  speaking: "말하기",
}

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-slate-200 text-slate-700",
  A2: "bg-blue-200 text-blue-700",
  B1: "bg-green-200 text-green-700",
  B2: "bg-purple-200 text-purple-700",
}

function cefrBadge(level: string) {
  if (!level)
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
        -
      </span>
    )
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CEFR_COLORS[level] ?? "bg-gray-100 text-gray-500"}`}
    >
      {level}
    </span>
  )
}

function lexileColor(level: number): string {
  if (level < 400) return "text-red-600"
  if (level < 700) return "text-orange-500"
  if (level < 1000) return "text-green-600"
  return "text-blue-600"
}

function cefrToPercent(level: string): number {
  switch (level) {
    case "A1":
      return 25
    case "A2":
      return 50
    case "B1":
      return 75
    case "B2":
      return 100
    default:
      return 0
  }
}

// ============================================================
// Page Component
// ============================================================

export default function StudentTrackerPage() {
  // Shared state
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  // Tab 1 state
  const [newName, setNewName] = useState("")
  const [newGrade, setNewGrade] = useState("")
  const [newClass, setNewClass] = useState("")
  const [addingStudent, setAddingStudent] = useState(false)
  const [filterGrade, setFilterGrade] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [editingLexile, setEditingLexile] = useState<string | null>(null)
  const [editLexileValue, setEditLexileValue] = useState("")
  const [savingLexile, setSavingLexile] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Tab 2 state
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [prescriptionLoading, setPrescriptionLoading] = useState(false)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState("")
  const [mastery, setMastery] = useState<StandardMastery[]>([])
  const [editLexileTab2, setEditLexileTab2] = useState("")
  const [editSkillKey, setEditSkillKey] = useState("")
  const [editSkillValue, setEditSkillValue] = useState("")
  const [savingTab2, setSavingTab2] = useState(false)

  // Tab 3 state
  const [reportLoading, setReportLoading] = useState(false)
  const [classReport, setClassReport] = useState<ClassReport | null>(null)

  // --------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    const params: { grade?: string; classNum?: string } = {}
    if (filterGrade) params.grade = filterGrade
    if (filterClass) params.classNum = filterClass
    const data = await getStudents(params)
    setStudents(data)
    setLoading(false)
  }, [filterGrade, filterClass])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // --------------------------------------------------------
  // Handlers – Tab 1
  // --------------------------------------------------------

  const handleAddStudent = async () => {
    if (!newName.trim() || !newGrade || !newClass) return
    setAddingStudent(true)
    const result = await addStudent({
      name: newName.trim(),
      grade: newGrade,
      classNum: newClass,
    })
    if (result.success) {
      setNewName("")
      setNewGrade("")
      setNewClass("")
      await fetchStudents()
    }
    setAddingStudent(false)
  }

  const handleSaveLexile = async (studentId: string) => {
    const val = parseInt(editLexileValue, 10)
    if (isNaN(val) || val < 0) return
    setSavingLexile(true)
    await updateStudentLexile(studentId, val)
    setEditingLexile(null)
    setEditLexileValue("")
    await fetchStudents()
    setSavingLexile(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteStudent(id)
    await fetchStudents()
    setDeletingId(null)
  }

  // --------------------------------------------------------
  // Handlers – Tab 2
  // --------------------------------------------------------

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  // 선택 학생의 성취기준별 숙달도 로드(과제 시도가 쌓이면 채워진다)
  useEffect(() => {
    if (!selectedStudentId) {
      setMastery([])
      return
    }
    getStudentStandardMastery(selectedStudentId).then(setMastery)
  }, [selectedStudentId])

  const handleGeneratePrescription = async () => {
    if (!selectedStudent) return
    setPrescriptionLoading(true)
    setPrescription(null)
    const result = await generateStudentPrescription({
      name: selectedStudent.name,
      lexileLevel: selectedStudent.lexile_level,
      lexileHistory: selectedStudent.lexile_history,
      skills: selectedStudent.skills,
      studentId: selectedStudent.id, // 실제 과제 시도 데이터 반영
    })
    if (result.success && result.data) {
      setPrescription(result.data)
    }
    setPrescriptionLoading(false)
  }

  const handlePrescribeAssign = async () => {
    if (!selectedStudent) return
    setAssigning(true)
    setAssignMsg("")
    const r = await prescribeWordlistAssignment({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      cefr: selectedStudent.skills?.reading || undefined,
      lexile: selectedStudent.lexile_level || undefined,
    })
    setAssigning(false)
    setAssignMsg(
      r.ok
        ? `✓ ${r.cefr} 맞춤 단어장 ${r.wordCount}개를 ${selectedStudent.name}에게 배정했습니다`
        : r.error ?? "배정 실패",
    )
  }

  const handleUpdateLexileTab2 = async () => {
    if (!selectedStudent) return
    const val = parseInt(editLexileTab2, 10)
    if (isNaN(val) || val < 0) return
    setSavingTab2(true)
    await updateStudentLexile(selectedStudent.id, val)
    setEditLexileTab2("")
    await fetchStudents()
    setSavingTab2(false)
  }

  const handleUpdateSkillTab2 = async () => {
    if (!selectedStudent || !editSkillKey || !editSkillValue) return
    setSavingTab2(true)
    await updateStudentSkill(selectedStudent.id, editSkillKey, editSkillValue)
    setEditSkillKey("")
    setEditSkillValue("")
    await fetchStudents()
    setSavingTab2(false)
  }

  // --------------------------------------------------------
  // Handlers – Tab 3
  // --------------------------------------------------------

  const handleGenerateReport = async () => {
    if (students.length === 0) return
    setReportLoading(true)
    setClassReport(null)
    const result = await generateClassReport(
      students.map((s) => ({
        name: s.name,
        lexileLevel: s.lexile_level,
        skills: s.skills,
      })),
    )
    if (result.success && result.data) {
      setClassReport(result.data)
    }
    setReportLoading(false)
  }

  // --------------------------------------------------------
  // Computed values
  // --------------------------------------------------------

  const avgLexile =
    students.length > 0
      ? Math.round(
          students.reduce((sum, s) => sum + s.lexile_level, 0) /
            students.length,
        )
      : 0

  function skillDistribution(skill: keyof Student["skills"]) {
    const counts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, "미측정": 0 }
    students.forEach((s) => {
      const lvl = s.skills[skill]
      if (lvl && counts[lvl] !== undefined) counts[lvl]++
      else counts["미측정"]++
    })
    return counts
  }

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">학생 학습 추적</h1>
                <p className="text-sky-100 text-sm">
                  학급 학생들의 영어 수준을 관리하고 AI 기반 학습 처방을 생성합니다
                </p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="text-white border-white/50 hover:bg-white/20 bg-transparent">
                대시보드
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="class-status" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="class-status">
              <GraduationCap className="h-4 w-4 mr-1" /> 학급 현황
            </TabsTrigger>
            <TabsTrigger value="individual">
              <BarChart3 className="h-4 w-4 mr-1" /> 개인 분석
            </TabsTrigger>
            <TabsTrigger value="ai-report">
              <Sparkles className="h-4 w-4 mr-1" /> AI 학급 리포트
            </TabsTrigger>
          </TabsList>

          {/* ====================================================== */}
          {/* TAB 1 – 학급 현황                                        */}
          {/* ====================================================== */}
          <TabsContent value="class-status" className="space-y-6">
            {/* Add student form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5" /> 학생 추가
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      이름
                    </label>
                    <Input
                      placeholder="학생 이름"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="w-[120px]">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      학년
                    </label>
                    <Select value={newGrade} onValueChange={setNewGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="학년" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[120px]">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      반
                    </label>
                    <Select value={newClass} onValueChange={setNewClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="반" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddStudent}
                    disabled={
                      addingStudent || !newName.trim() || !newGrade || !newClass
                    }
                  >
                    {addingStudent ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-1" />
                    )}
                    추가
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filter */}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-medium text-gray-600">필터:</span>
              <Select
                value={filterGrade}
                onValueChange={(v) => setFilterGrade(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="전체 학년" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 학년</SelectItem>
                  {GRADES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterClass}
                onValueChange={(v) => setFilterClass(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="전체 반" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 반</SelectItem>
                  {CLASSES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                    <span className="ml-2 text-gray-500">불러오는 중...</span>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    등록된 학생이 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">
                            이름
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-gray-600">
                            학년
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-gray-600">
                            반
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-gray-600">
                            Lexile 수준
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-gray-600">
                            읽기
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-gray-600">
                            쓰기
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-gray-600">
                            듣기
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-gray-600">
                            말하기
                          </th>
                          <th className="text-center px-3 py-3 font-medium text-gray-600">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {students.map((student) => (
                          <tr
                            key={student.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">
                              {student.name}
                            </td>
                            <td className="text-center px-3 py-3">
                              {student.grade}학년
                            </td>
                            <td className="text-center px-3 py-3">
                              {student.classNum}반
                            </td>
                            <td className="text-center px-3 py-3">
                              {editingLexile === student.id ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <Input
                                    type="number"
                                    className="w-20 h-7 text-center text-sm"
                                    value={editLexileValue}
                                    onChange={(e) =>
                                      setEditLexileValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleSaveLexile(student.id)
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() =>
                                      handleSaveLexile(student.id)
                                    }
                                    disabled={savingLexile}
                                  >
                                    {savingLexile ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  className={`font-semibold ${lexileColor(student.lexile_level)} hover:underline cursor-pointer`}
                                  onClick={() => {
                                    setEditingLexile(student.id)
                                    setEditLexileValue(
                                      String(student.lexile_level),
                                    )
                                  }}
                                >
                                  {student.lexile_level}L
                                </button>
                              )}
                            </td>
                            <td className="text-center px-3 py-3">
                              {cefrBadge(student.skills.reading)}
                            </td>
                            <td className="text-center px-3 py-3">
                              {cefrBadge(student.skills.writing)}
                            </td>
                            <td className="text-center px-3 py-3">
                              {cefrBadge(student.skills.listening)}
                            </td>
                            <td className="text-center px-3 py-3">
                              {cefrBadge(student.skills.speaking)}
                            </td>
                            <td className="text-center px-3 py-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(student.id)}
                                disabled={deletingId === student.id}
                              >
                                {deletingId === student.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary cards */}
            {students.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>평균 Lexile</CardDescription>
                    <CardTitle
                      className={`text-3xl ${lexileColor(avgLexile)}`}
                    >
                      {avgLexile}L
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>학생 수</CardDescription>
                    <CardTitle className="text-3xl text-sky-600">
                      {students.length}명
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>기능별 분포</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(
                      Object.keys(SKILL_LABELS) as Array<
                        keyof typeof SKILL_LABELS
                      >
                    ).map((skill) => {
                      const dist = skillDistribution(
                        skill as keyof Student["skills"],
                      )
                      return (
                        <div key={skill} className="text-xs">
                          <span className="font-medium">
                            {SKILL_LABELS[skill]}:
                          </span>{" "}
                          {Object.entries(dist)
                            .filter(([, v]) => v > 0)
                            .map(([k, v]) => `${k}(${v})`)
                            .join(" ")}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ====================================================== */}
          {/* TAB 2 – 개인 분석                                        */}
          {/* ====================================================== */}
          <TabsContent value="individual" className="space-y-6">
            {/* Student selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">학생 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedStudentId}
                  onValueChange={(v) => {
                    setSelectedStudentId(v)
                    setPrescription(null)
                  }}
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="학생을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.grade}학년 {s.classNum}반)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedStudent && (
              <>
                {/* Student info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-sky-500" />
                      {selectedStudent.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedStudent.grade}학년 {selectedStudent.classNum}반
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        현재 Lexile 수준:
                      </span>
                      <span
                        className={`text-2xl font-bold ${lexileColor(selectedStudent.lexile_level)}`}
                      >
                        {selectedStudent.lexile_level}L
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Lexile history bar chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-sky-500" />
                      Lexile 변화 추이
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedStudent.lexile_history.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        아직 기록이 없습니다.
                      </p>
                    ) : (
                      <div className="flex items-end gap-2 h-48 px-2">
                        {(() => {
                          const history = selectedStudent.lexile_history
                          const maxLevel = Math.max(
                            ...history.map((h) => h.level),
                            100,
                          )
                          return history.map((entry, idx) => {
                            const heightPercent =
                              (entry.level / maxLevel) * 100
                            return (
                              <div
                                key={idx}
                                className="flex flex-col items-center flex-1 min-w-[32px]"
                              >
                                <span className="text-xs font-medium text-gray-600 mb-1">
                                  {entry.level}L
                                </span>
                                <div
                                  className="w-full rounded-t bg-gradient-to-t from-sky-500 to-cyan-400 transition-all duration-300"
                                  style={{
                                    height: `${heightPercent}%`,
                                    minHeight: "4px",
                                  }}
                                />
                                <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">
                                  {entry.date.slice(5)}
                                </span>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills radar (horizontal bars) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">기능별 CEFR 수준</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(
                      Object.entries(SKILL_LABELS) as Array<
                        [string, string]
                      >
                    ).map(([key, label]) => {
                      const level =
                        selectedStudent.skills[
                          key as keyof Student["skills"]
                        ]
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {label}
                            </span>
                            {cefrBadge(level)}
                          </div>
                          <Progress
                            value={cefrToPercent(level)}
                            className="h-3"
                          />
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* 성취기준별 숙달도 (과제 시도에서 집계) */}
                {mastery.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-teal-600" />
                        성취기준별 숙달도
                      </CardTitle>
                      <CardDescription>
                        과제 시도에서 집계 · 약한 기준부터 표시
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mastery.map((m) => {
                        const pct = Math.round(m.accuracy * 100)
                        const tone =
                          pct < 50 ? "bg-red-500" : pct < 75 ? "bg-amber-500" : "bg-teal-500"
                        return (
                          <div key={m.standardId} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="font-mono text-xs text-teal-700">
                                {m.standardId}
                              </span>
                              <span className="text-slate-500">
                                {m.correct}/{m.attempts} · {pct}%
                              </span>
                            </div>
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {m.standardText}
                            </p>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div
                                className={`h-2 rounded-full ${tone}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* AI prescription */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      AI 학습 처방
                    </CardTitle>
                    <CardDescription>
                      학생의 현재 수준과 이력을 기반으로 맞춤형 학습 처방을
                      생성합니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleGeneratePrescription}
                        disabled={prescriptionLoading}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        {prescriptionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        AI 학습 처방 생성
                      </Button>
                      {/* 진단→처방→과제 원클릭(P-B): 학생 수준 맞춤 단어장 즉시 배정 */}
                      <Button
                        variant="outline"
                        onClick={handlePrescribeAssign}
                        disabled={assigning}
                        className="border-teal-300 text-teal-700 hover:bg-teal-50"
                      >
                        {assigning ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <BookOpen className="h-4 w-4 mr-2" />
                        )}
                        맞춤 단어장 배정
                      </Button>
                    </div>
                    {assignMsg && (
                      <p className="text-sm text-teal-700">{assignMsg}</p>
                    )}

                    {prescription && (
                      <div id="export-student-report" className="mt-4">
                        <div className="flex justify-end mb-3">
                          <button
                            type="button"
                            onClick={() => exportToPDF("export-student-report", "student-report.pdf")}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            PDF 다운로드
                          </button>
                        </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Activities */}
                        <Card className="border-sky-200 bg-sky-50/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base text-sky-700 flex items-center gap-1">
                              <BookOpen className="h-4 w-4" /> 추천 활동
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {prescription.activities.map((item, idx) => (
                              <div key={idx}>
                                <p className="font-medium text-sm">
                                  {idx + 1}. {item.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        {/* Materials */}
                        <Card className="border-green-200 bg-green-50/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base text-green-700 flex items-center gap-1">
                              <BookOpen className="h-4 w-4" /> 추천 교재
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {prescription.materials.map((item, idx) => (
                              <div key={idx}>
                                <p className="font-medium text-sm">
                                  {idx + 1}. {item.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        {/* Goals */}
                        <Card className="border-purple-200 bg-purple-50/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base text-purple-700 flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" /> 학습 목표
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {prescription.goals.map((item, idx) => (
                              <div key={idx}>
                                <p className="font-medium text-sm">
                                  {idx + 1}. {item.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Update forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Lexile 수준 업데이트
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="새 Lexile 수준"
                          value={editLexileTab2}
                          onChange={(e) => setEditLexileTab2(e.target.value)}
                        />
                        <Button
                          onClick={handleUpdateLexileTab2}
                          disabled={savingTab2 || !editLexileTab2}
                        >
                          {savingTab2 ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          저장
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        기능 수준 업데이트
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Select
                          value={editSkillKey}
                          onValueChange={setEditSkillKey}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="기능" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SKILL_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={editSkillValue}
                          onValueChange={setEditSkillValue}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="수준" />
                          </SelectTrigger>
                          <SelectContent>
                            {CEFR_LEVELS.map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleUpdateSkillTab2}
                          disabled={
                            savingTab2 || !editSkillKey || !editSkillValue
                          }
                        >
                          {savingTab2 ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          저장
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {!selectedStudent && !loading && (
              <Card>
                <CardContent className="py-12 text-center text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  학생을 선택하면 상세 분석을 확인할 수 있습니다.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ====================================================== */}
          {/* TAB 3 – AI 학급 리포트                                    */}
          {/* ====================================================== */}
          <TabsContent value="ai-report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  AI 학급 리포트
                </CardTitle>
                <CardDescription>
                  현재 필터된 학생 {students.length}명의 데이터를 기반으로 학급
                  분석 리포트를 생성합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerateReport}
                  disabled={reportLoading || students.length === 0}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {reportLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  리포트 생성
                </Button>
                {students.length === 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    학생 데이터가 필요합니다. 먼저 학급 현황 탭에서 학생을
                    등록해주세요.
                  </p>
                )}
              </CardContent>
            </Card>

            {classReport && (
              <>
                {/* Overall analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">학급 전체 분석</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {classReport.analysis}
                    </p>
                  </CardContent>
                </Card>

                {/* Groups */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    수준별 그룹핑 제안
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classReport.groups.map((group, idx) => (
                      <Card
                        key={idx}
                        className="border-l-4"
                        style={{
                          borderLeftColor:
                            idx === 0
                              ? "#0ea5e9"
                              : idx === 1
                                ? "#22c55e"
                                : idx === 2
                                  ? "#f59e0b"
                                  : "#8b5cf6",
                        }}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {group.name}
                          </CardTitle>
                          <CardDescription>
                            {group.students.join(", ")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              교수전략
                            </p>
                            <p className="text-sm text-gray-700">
                              {group.strategy}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

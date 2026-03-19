"use client"

import { useState, useEffect } from "react"
import { type ModelName } from "@/lib/models"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ClipboardList,
  Loader2,
  Sparkles,
  Copy,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
} from "lucide-react"
import Link from "next/link"
import { exportToPDF } from "@/lib/pdf-export"
import {
  generateRubricAction,
  getRubrics,
  deleteRubric,
  type SavedRubric,
} from "@/app/actions/assessment"

// ============================================================
// 상수
// ============================================================

const GRADES = [
  { value: "middle1", label: "중1" },
  { value: "middle2", label: "중2" },
  { value: "middle3", label: "중3" },
  { value: "high1", label: "고1" },
  { value: "high2", label: "고2" },
  { value: "high3", label: "고3" },
]

const SKILLS = [
  { value: "reading", label: "읽기" },
  { value: "writing", label: "쓰기" },
  { value: "listening", label: "듣기" },
  { value: "speaking", label: "말하기" },
]

const CEFR_LEVELS = [
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
]

const LEVEL_COUNTS = [3, 4, 5]

const QUICK_TOPICS = [
  "자기소개 에세이 쓰기",
  "뉴스 기사 요약하기",
  "토론 발표하기",
  "영어 일기 쓰기",
  "영화 리뷰 작성",
  "환경 문제 프레젠테이션",
]

const GRADE_LABELS: Record<string, string> = {
  middle1: "중1",
  middle2: "중2",
  middle3: "중3",
  high1: "고1",
  high2: "고2",
  high3: "고3",
}

const SKILL_LABELS: Record<string, string> = {
  reading: "읽기",
  writing: "쓰기",
  listening: "듣기",
  speaking: "말하기",
}

function getLevelBorderColor(level: number, maxLevel: number): string {
  if (level === maxLevel) return "border-l-emerald-500"
  if (level === maxLevel - 1) return "border-l-blue-500"
  if (level === maxLevel - 2) return "border-l-yellow-500"
  if (level === maxLevel - 3) return "border-l-orange-500"
  return "border-l-red-500"
}

function getLevelBgColor(level: number, maxLevel: number): string {
  if (level === maxLevel) return "bg-emerald-50"
  if (level === maxLevel - 1) return "bg-blue-50"
  if (level === maxLevel - 2) return "bg-yellow-50"
  if (level === maxLevel - 3) return "bg-orange-50"
  return "bg-red-50"
}

// ============================================================
// 타입
// ============================================================

interface RubricResult {
  id: number
  title: string
  grade: string
  skill: string
  topic: string
  cefrTarget: string
  levels: number
  criteria: Array<{
    level: number
    label: string
    canDo: string
    description: string
    score: string
  }>
  teacherNotes: string
  created_at: string
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function AssessmentToolsPage() {
  const [activeTab, setActiveTab] = useState("create")

  // 생성 탭 상태
  const [grade, setGrade] = useState("high1")
  const [skill, setSkill] = useState("writing")
  const [topic, setTopic] = useState("")
  const [cefrTarget, setCefrTarget] = useState("B1")
  const [levels, setLevels] = useState(5)
  const [selectedModel, setSelectedModel] = useState<ModelName>("gemini-flash")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<RubricResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // 저장 탭 상태
  const [savedRubrics, setSavedRubrics] = useState<SavedRubric[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [filterGrade, setFilterGrade] = useState("")
  const [filterSkill, setFilterSkill] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // 저장 탭 전환 시 목록 로드
  useEffect(() => {
    if (activeTab === "saved") {
      loadSavedRubrics()
    }
  }, [activeTab, filterGrade, filterSkill])

  const loadSavedRubrics = async () => {
    setLoadingSaved(true)
    try {
      const rubrics = await getRubrics({
        grade: filterGrade || undefined,
        skill: filterSkill || undefined,
      })
      setSavedRubrics(rubrics)
    } catch {
      console.error("루브릭 목록 로딩 실패")
    } finally {
      setLoadingSaved(false)
    }
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("평가 주제를 입력해주세요.")
      return
    }
    setGenerating(true)
    setError("")
    setResult(null)
    setSaved(false)

    try {
      const res = await Promise.race([
        generateRubricAction({ grade, skill, topic, cefrTarget, levels, model: selectedModel }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 60000)
        ),
      ])

      if (res.success && res.rubric) {
        setResult(res.rubric)
        setSaved(true)
      } else {
        setError(res.error || "루브릭 생성에 실패했습니다.")
      }
    } catch {
      setError("루브릭 생성 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!result) return

    const lines: string[] = []
    lines.push(result.title)
    lines.push("")
    lines.push(`학년: ${GRADE_LABELS[result.grade] || result.grade}`)
    lines.push(`기능: ${SKILL_LABELS[result.skill] || result.skill}`)
    lines.push(`주제: ${result.topic}`)
    lines.push(`목표 CEFR: ${result.cefrTarget}`)
    lines.push("")
    lines.push("단계\t등급\tCEFR Can-Do 서술문\t수행 기준\t점수 범위")
    lines.push("─".repeat(80))
    for (const c of result.criteria) {
      lines.push(`${c.level}\t${c.label}\t${c.canDo}\t${c.description}\t${c.score}`)
    }
    lines.push("")
    lines.push(`[교사 참고사항] ${result.teacherNotes}`)

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const res = await deleteRubric(id)
      if (res.success) {
        setSavedRubrics((prev) => prev.filter((r) => r.id !== id))
        setConfirmDeleteId(null)
      }
    } catch {
      console.error("삭제 실패")
    } finally {
      setDeletingId(null)
    }
  }

  // ============================================================
  // 렌더
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-white/80 hover:text-white text-sm">
              홈
            </Link>
            <span className="text-white/60">/</span>
            <span className="text-sm">평가 도구</span>
          </div>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">CEFR 루브릭 생성기</h1>
              <p className="text-white/80 text-sm mt-1">
                2022 개정 교육과정 기반 CEFR Can-Do 수행평가 루브릭을 AI로 생성합니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI 루브릭 생성
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              저장된 루브릭
            </TabsTrigger>
          </TabsList>

          {/* ============================== */}
          {/* 탭 1: AI 루브릭 생성 */}
          {/* ============================== */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>루브릭 설정</CardTitle>
                <CardDescription>
                  평가할 학년, 기능, 주제를 선택하고 AI로 CEFR 기반 루브릭을 생성하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 학년 선택 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    학년 선택
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((g) => (
                      <Button
                        key={g.value}
                        variant={grade === g.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGrade(g.value)}
                      >
                        {g.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 기능 선택 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    기능 선택
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((s) => (
                      <Button
                        key={s.value}
                        variant={skill === s.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSkill(s.value)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 평가 주제 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    평가 주제
                  </label>
                  <Input
                    placeholder="예: 자기소개 에세이 쓰기"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {QUICK_TOPICS.map((qt) => (
                      <button
                        key={qt}
                        onClick={() => setTopic(qt)}
                        className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        {qt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 목표 CEFR */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    목표 CEFR 레벨
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CEFR_LEVELS.map((c) => (
                      <Button
                        key={c.value}
                        variant={cefrTarget === c.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCefrTarget(c.value)}
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 평가 단계 수 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    평가 단계 수
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LEVEL_COUNTS.map((lc) => (
                      <Button
                        key={lc}
                        variant={levels === lc ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLevels(lc)}
                      >
                        {lc}단계
                      </Button>
                    ))}
                  </div>
                </div>

                {/* AI 모델 선택 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">AI 모델:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedModel(selectedModel === "gemini-flash" ? "claude-sonnet" : "gemini-flash")}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      selectedModel === "gemini-flash"
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-purple-50 border-purple-300 text-purple-700"
                    }`}
                  >
                    {selectedModel === "gemini-flash" ? "Gemini Flash" : "Claude Sonnet"}
                  </button>
                </div>

                {/* 에러 */}
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                    {error}
                  </div>
                )}

                {/* 생성 버튼 */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      루브릭 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      AI 루브릭 생성
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 결과 표시 */}
            {result && (
              <div className="space-y-4" id="export-rubric">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{result.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {GRADE_LABELS[result.grade] || result.grade} /{" "}
                          {SKILL_LABELS[result.skill] || result.skill} / CEFR{" "}
                          {result.cefrTarget} / {result.topic}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => exportToPDF("export-rubric", "rubric.pdf")}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF 다운로드
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          {copied ? "복사됨!" : "복사"}
                        </Button>
                        {saved && (
                          <div className="flex items-center text-sm text-emerald-600 gap-1">
                            <Save className="h-4 w-4" />
                            저장됨
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* 루브릭 테이블 */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100 text-gray-600">
                            <th className="text-left px-3 py-2 w-16">단계</th>
                            <th className="text-left px-3 py-2 w-32">등급</th>
                            <th className="text-left px-3 py-2">CEFR Can-Do 서술문</th>
                            <th className="text-left px-3 py-2">수행 기준</th>
                            <th className="text-left px-3 py-2 w-24">점수 범위</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.criteria.map((c) => (
                            <tr
                              key={c.level}
                              className={`border-l-4 ${getLevelBorderColor(c.level, result.levels)} ${getLevelBgColor(c.level, result.levels)}`}
                            >
                              <td className="px-3 py-3 font-bold text-center">
                                {c.level}
                              </td>
                              <td className="px-3 py-3 font-medium">{c.label}</td>
                              <td className="px-3 py-3 text-gray-700">{c.canDo}</td>
                              <td className="px-3 py-3 text-gray-700">{c.description}</td>
                              <td className="px-3 py-3 text-center font-medium">
                                {c.score}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* 교사 참고사항 */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">
                          교사 참고사항
                        </h4>
                        <p className="text-sm text-blue-800">{result.teacherNotes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ============================== */}
          {/* 탭 2: 저장된 루브릭 */}
          {/* ============================== */}
          <TabsContent value="saved" className="space-y-6">
            {/* 필터 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      학년 필터
                    </label>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant={filterGrade === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterGrade("")}
                      >
                        전체
                      </Button>
                      {GRADES.map((g) => (
                        <Button
                          key={g.value}
                          variant={filterGrade === g.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterGrade(g.value)}
                        >
                          {g.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      기능 필터
                    </label>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant={filterSkill === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterSkill("")}
                      >
                        전체
                      </Button>
                      {SKILLS.map((s) => (
                        <Button
                          key={s.value}
                          variant={filterSkill === s.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterSkill(s.value)}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 목록 */}
            {loadingSaved ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                루브릭 목록을 불러오는 중...
              </div>
            ) : savedRubrics.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>저장된 루브릭이 없습니다.</p>
                <p className="text-sm mt-1">AI 루브릭 생성 탭에서 새 루브릭을 만들어보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedRubrics.map((rubric) => (
                  <Card key={rubric.id} className="overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        setExpandedId(expandedId === rubric.id ? null : rubric.id)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {rubric.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="px-2 py-0.5 rounded bg-gray-100">
                            {GRADE_LABELS[rubric.grade] || rubric.grade}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-100">
                            {SKILL_LABELS[rubric.skill] || rubric.skill}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                            CEFR {rubric.cefrTarget}
                          </span>
                          <span className="text-gray-400">
                            {rubric.created_at
                              ? new Date(rubric.created_at).toLocaleDateString("ko-KR")
                              : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {confirmDeleteId === rubric.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600 mr-1">삭제?</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                              disabled={deletingId === rubric.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(rubric.id)
                              }}
                            >
                              {deletingId === rubric.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "확인"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDeleteId(null)
                              }}
                            >
                              취소
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-gray-400 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmDeleteId(rubric.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {expandedId === rubric.id ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* 확장된 루브릭 테이블 */}
                    {expandedId === rubric.id && (
                      <CardContent className="border-t pt-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100 text-gray-600">
                                <th className="text-left px-3 py-2 w-16">단계</th>
                                <th className="text-left px-3 py-2 w-32">등급</th>
                                <th className="text-left px-3 py-2">
                                  CEFR Can-Do 서술문
                                </th>
                                <th className="text-left px-3 py-2">수행 기준</th>
                                <th className="text-left px-3 py-2 w-24">점수 범위</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rubric.criteria.map((c) => (
                                <tr
                                  key={c.level}
                                  className={`border-l-4 ${getLevelBorderColor(c.level, rubric.levels)} ${getLevelBgColor(c.level, rubric.levels)}`}
                                >
                                  <td className="px-3 py-3 font-bold text-center">
                                    {c.level}
                                  </td>
                                  <td className="px-3 py-3 font-medium">{c.label}</td>
                                  <td className="px-3 py-3 text-gray-700">{c.canDo}</td>
                                  <td className="px-3 py-3 text-gray-700">
                                    {c.description}
                                  </td>
                                  <td className="px-3 py-3 text-center font-medium">
                                    {c.score}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {rubric.teacherNotes && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-sm font-medium text-blue-900">
                                교사 참고사항:{" "}
                              </span>
                              <span className="text-sm text-blue-800">
                                {rubric.teacherNotes}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { type ModelName } from "@/lib/models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  BookOpen,
  Clock,
  GraduationCap,
  Save,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react"
import Link from "next/link"
import { exportToPDF } from "@/lib/pdf-export"
import { generateLessonPlan, getLessonCases } from "@/app/actions/lessons"
import type { LessonCase } from "@/lib/turso"

const GRADES = [
  { value: "middle1", label: "중1" },
  { value: "middle2", label: "중2" },
  { value: "middle3", label: "중3" },
  { value: "high1", label: "고1" },
  { value: "high2", label: "고2" },
  { value: "high3", label: "고3" },
]

const SKILLS = [
  { value: "reading", label: "읽기", color: "bg-blue-100 text-blue-800" },
  { value: "writing", label: "쓰기", color: "bg-green-100 text-green-800" },
  { value: "listening", label: "듣기", color: "bg-orange-100 text-orange-800" },
  { value: "speaking", label: "말하기", color: "bg-purple-100 text-purple-800" },
]

const DURATIONS = [
  { value: "1차시", label: "1차시 (45분)" },
  { value: "2차시", label: "2차시 (90분)" },
]

const GRADE_LABELS: Record<string, string> = {
  middle1: "중학교 1학년",
  middle2: "중학교 2학년",
  middle3: "중학교 3학년",
  high1: "고등학교 1학년",
  high2: "고등학교 2학년",
  high3: "고등학교 3학년",
}

const SKILL_LABELS: Record<string, string> = {
  reading: "읽기",
  writing: "쓰기",
  listening: "듣기",
  speaking: "말하기",
}

export default function LessonPlannerPage() {
  const [activeTab, setActiveTab] = useState("create")

  // 폼 상태
  const [grade, setGrade] = useState("high1")
  const [skill, setSkill] = useState("reading")
  const [topic, setTopic] = useState("")
  const [duration, setDuration] = useState("1차시")
  const [lexileRange, setLexileRange] = useState("")
  const [selectedModel, setSelectedModel] = useState<ModelName>("gemini-flash")
  const [generating, setGenerating] = useState(false)
  const [generatedLesson, setGeneratedLesson] = useState<LessonCase | null>(null)
  const [error, setError] = useState("")

  // 저장된 수업 목록
  const [savedLessons, setSavedLessons] = useState<LessonCase[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("수업 주제를 입력해주세요.")
      return
    }
    setGenerating(true)
    setError("")
    setGeneratedLesson(null)

    try {
      const result = await Promise.race([
        generateLessonPlan({ grade, skill, topic, duration, lexileRange: lexileRange || undefined, model: selectedModel }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 60000)),
      ])

      if (result.success && result.lesson) {
        setGeneratedLesson(result.lesson)
      } else {
        setError(result.error || "수업 설계 생성에 실패했습니다.")
      }
    } catch (e) {
      setError("AI 응답 시간이 초과되었습니다. 다시 시도해주세요.")
    } finally {
      setGenerating(false)
    }
  }

  const loadSavedLessons = async () => {
    setLoadingLessons(true)
    const lessons = await getLessonCases({ limit: 30 })
    setSavedLessons(lessons)
    setLoadingLessons(false)
  }

  const skillColor = (s: string) => SKILLS.find((sk) => sk.value === s)?.color ?? "bg-gray-100 text-gray-700"

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                홈으로
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-teal-600" />
                AI 수업 설계 도우미
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                학년·기능·주제를 입력하면 Claude AI가 수업 지도안을 생성합니다
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/csat-question-generation">문항 생성 AI</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">대시보드</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v)
            if (v === "saved") loadSavedLessons()
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="create" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI 수업 설계
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <BookOpen className="h-4 w-4" />
              저장된 수업
            </TabsTrigger>
          </TabsList>

          {/* ── AI 수업 설계 탭 ── */}
          <TabsContent value="create">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 왼쪽: 입력 패널 */}
              <Card>
                <CardHeader>
                  <CardTitle>수업 조건 설정</CardTitle>
                  <CardDescription>아래 조건을 설정하면 AI가 수업 지도안을 작성합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* 학년 */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">학년</Label>
                    <div className="flex flex-wrap gap-2">
                      {GRADES.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setGrade(g.value)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            grade === g.value
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-slate-600 border-slate-300 hover:border-teal-400"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 기능 */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">언어 기능 (Skill)</Label>
                    <div className="flex gap-2">
                      {SKILLS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSkill(s.value)}
                          className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                            skill === s.value
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-slate-600 border-slate-300 hover:border-teal-400"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 수업 시간 */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">수업 시간</Label>
                    <div className="flex gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setDuration(d.value)}
                          className={`flex-1 py-2 rounded-lg text-sm border transition-colors flex items-center justify-center gap-1.5 ${
                            duration === d.value
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-slate-600 border-slate-300 hover:border-teal-400"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 주제 */}
                  <div>
                    <Label htmlFor="topic" className="text-sm font-medium mb-1.5 block">
                      수업 주제 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="topic"
                      placeholder="예: 환경 보호, 디지털 미디어 리터러시, 진로와 직업..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                  </div>

                  {/* Lexile 범위 (선택) */}
                  <div>
                    <Label htmlFor="lexile" className="text-sm font-medium mb-1.5 block">
                      학생 Lexile 범위 <span className="text-slate-400 text-xs">(선택)</span>
                    </Label>
                    <Input
                      id="lexile"
                      placeholder="예: 700-900 (비워두면 학년 기준 자동 설정)"
                      value={lexileRange}
                      onChange={(e) => setLexileRange(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

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

                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        AI가 수업 지도안을 작성하는 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        수업 지도안 생성하기
                      </>
                    )}
                  </Button>

                  {/* 예시 주제 */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-slate-400 mb-2">예시 주제 빠른 선택</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "환경과 지속 가능성",
                        "인공지능과 미래",
                        "문화 다양성",
                        "디지털 리터러시",
                        "건강과 웰빙",
                        "글로벌 시민의식",
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          className="text-xs px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded border border-slate-200 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 오른쪽: 결과 패널 */}
              <div className="space-y-4">
                {generating && (
                  <Card className="border-teal-200">
                    <CardContent className="flex items-center justify-center py-16">
                      <div className="text-center space-y-3">
                        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto" />
                        <p className="text-slate-600">AI가 수업 지도안을 작성하고 있습니다...</p>
                        <p className="text-xs text-slate-400">
                          {GRADE_LABELS[grade]} {SKILL_LABELS[skill]} 수업 · {topic}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {generatedLesson && !generating && (
                  <div id="export-lesson" className="space-y-4">
                    {/* 헤더 */}
                    <Card className="border-teal-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{generatedLesson.topic}</CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{GRADE_LABELS[generatedLesson.grade]}</Badge>
                              <Badge className={skillColor(generatedLesson.skill)}>
                                {SKILL_LABELS[generatedLesson.skill] ?? generatedLesson.skill}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {generatedLesson.duration}
                              </Badge>
                              {generatedLesson.lexile_range && (
                                <Badge variant="outline">Lexile {generatedLesson.lexile_range}L</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mt-1">
                            <button
                              type="button"
                              onClick={() => exportToPDF("export-lesson", "lesson-plan.pdf")}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                              PDF 다운로드
                            </button>
                            <span title="자동 저장됨">
                              <Save className="h-4 w-4 text-teal-600" />
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* 수업 목표 */}
                    {generatedLesson.objectives && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-teal-700">수업 목표 (성취기준 연계)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {generatedLesson.objectives}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* 수업 활동 */}
                    {generatedLesson.activity && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-teal-700">수업 활동 단계</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {generatedLesson.activity}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* 교재·자료 */}
                      {generatedLesson.material && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-slate-600">활용 자료</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {generatedLesson.material}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* 기대 성과 */}
                      {generatedLesson.outcome && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-slate-600">기대 학습 성과</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {generatedLesson.outcome}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* 교사 참고사항 */}
                    {generatedLesson.teacher_notes && (
                      <Card className="border-amber-200 bg-amber-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-amber-800">교사 참고사항 및 유의점</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {generatedLesson.teacher_notes}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <p className="text-xs text-slate-400 text-center">
                      수업 지도안이 자동으로 저장되었습니다.{" "}
                      <button
                        type="button"
                        className="text-teal-600 underline"
                        onClick={() => {
                          setActiveTab("saved")
                          loadSavedLessons()
                        }}
                      >
                        저장된 수업 보기
                      </button>
                    </p>
                  </div>
                )}

                {!generating && !generatedLesson && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-16 text-center">
                      <div className="space-y-3">
                        <GraduationCap className="h-10 w-10 text-slate-300 mx-auto" />
                        <div>
                          <p className="text-slate-400 text-sm">왼쪽에서 조건을 설정하고</p>
                          <p className="text-slate-400 text-sm">수업 지도안 생성 버튼을 누르세요</p>
                        </div>
                        <div className="pt-2 text-xs text-slate-300">
                          <p>학년 · 기능 · 주제 → AI 수업 지도안</p>
                          <p>수업 목표 · 활동 단계 · 자료 · 평가 기준</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── 저장된 수업 탭 ── */}
          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>저장된 수업 지도안</CardTitle>
                    <CardDescription>AI가 생성하고 저장된 수업 지도안 목록입니다</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadSavedLessons} disabled={loadingLessons}>
                    {loadingLessons ? <Loader2 className="h-4 w-4 animate-spin" /> : "새로고침"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLessons && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  </div>
                )}
                {!loadingLessons && savedLessons.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <GraduationCap className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">저장된 수업 지도안이 없습니다.</p>
                    <p className="text-xs mt-1">AI 수업 설계 탭에서 먼저 수업을 생성해보세요.</p>
                  </div>
                )}
                <div className="space-y-3">
                  {savedLessons.map((lesson) => (
                    <div key={lesson.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                        onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline">{GRADE_LABELS[lesson.grade] ?? lesson.grade}</Badge>
                          <Badge className={skillColor(lesson.skill)}>
                            {SKILL_LABELS[lesson.skill] ?? lesson.skill}
                          </Badge>
                          {lesson.duration && (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration}
                            </Badge>
                          )}
                          <span className="text-sm text-slate-700 font-medium">{lesson.topic}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400">{lesson.created_at.slice(0, 10)}</span>
                          {expandedId === lesson.id ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {expandedId === lesson.id && (
                        <div className="border-t p-4 bg-slate-50 space-y-4">
                          {lesson.objectives && (
                            <div>
                              <p className="text-xs font-semibold text-teal-700 mb-1">수업 목표</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lesson.objectives}</p>
                            </div>
                          )}
                          {lesson.activity && (
                            <div>
                              <p className="text-xs font-semibold text-teal-700 mb-1">수업 활동</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lesson.activity}</p>
                            </div>
                          )}
                          {lesson.material && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">활용 자료</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lesson.material}</p>
                            </div>
                          )}
                          {lesson.teacher_notes && (
                            <div className="p-3 bg-amber-50 rounded border border-amber-200">
                              <p className="text-xs font-semibold text-amber-700 mb-1">교사 참고사항</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lesson.teacher_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t py-4 mt-8">
        <div className="container mx-auto text-center text-xs text-slate-400">
          수업 지도안은 자동으로 저장됩니다. AI 생성 결과는 교사의 전문적 검토 후 활용하세요.
        </div>
      </footer>
    </div>
  )
}

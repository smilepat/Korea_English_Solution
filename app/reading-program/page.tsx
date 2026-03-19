"use client"

import { useState, useEffect, useCallback } from "react"
import { type ModelName } from "@/lib/models"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Loader2,
  Sparkles,
  BarChart3,
  Trophy,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react"
import Link from "next/link"
import { exportToPDF } from "@/lib/pdf-export"
import {
  generateReading,
  getReadingMaterials,
  getReadingStats,
  saveReadingLog,
} from "@/app/actions/reading"

// ============================================================
// 타입 정의
// ============================================================

interface ReadingMaterial {
  id: number
  title: string
  content: string
  vocabulary: string[]
  questions: Array<{ question: string; options: string[]; answer: number }>
  lexile_level: number
  topic: string
  genre: string
  word_count: number
  created_at: string
}

interface ReadingStats {
  totalWordsRead: number
  totalMaterialsRead: number
  averageScore: number
  logs: Array<{
    id: number
    material_id: number
    words_read: number
    score: number
    created_at: string
    title?: string
  }>
}

// ============================================================
// 상수
// ============================================================

const LEXILE_LEVELS = [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]

const QUICK_TOPICS = [
  "School Life",
  "Technology",
  "Environment",
  "Culture",
  "Health",
  "Space",
]

const GENRES = [
  { value: "narrative", label: "Narrative (서사문)" },
  { value: "expository", label: "Expository (설명문)" },
  { value: "persuasive", label: "Persuasive (논설문)" },
]

const WORD_COUNTS = [200, 400, 600]

const YEARLY_WORD_GOAL = 100000

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function ReadingProgramPage() {
  const [activeTab, setActiveTab] = useState("generate")

  // 생성 탭 상태
  const [lexileLevel, setLexileLevel] = useState<number>(600)
  const [topic, setTopic] = useState("")
  const [genre, setGenre] = useState("narrative")
  const [wordCount, setWordCount] = useState(400)
  const [selectedModel, setSelectedModel] = useState<ModelName>("gemini-flash")
  const [generating, setGenerating] = useState(false)
  const [generatedMaterial, setGeneratedMaterial] = useState<ReadingMaterial | null>(null)
  const [error, setError] = useState("")

  // 퀴즈 상태
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [logSaved, setLogSaved] = useState(false)

  // 기록 탭 상태
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // 저장된 자료 탭 상태
  const [savedMaterials, setSavedMaterials] = useState<ReadingMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [filterLexile, setFilterLexile] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // ----------------------------------------------------------
  // 데이터 로딩
  // ----------------------------------------------------------

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await getReadingStats()
      setStats(data)
    } catch {
      console.error("통계 로딩 실패")
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadMaterials = useCallback(async () => {
    setLoadingMaterials(true)
    try {
      const data = await getReadingMaterials(
        filterLexile ? { lexileLevel: filterLexile } : undefined
      )
      setSavedMaterials(data)
    } catch {
      console.error("자료 로딩 실패")
    } finally {
      setLoadingMaterials(false)
    }
  }, [filterLexile])

  useEffect(() => {
    if (activeTab === "history") loadStats()
    if (activeTab === "saved") loadMaterials()
  }, [activeTab, loadStats, loadMaterials])

  useEffect(() => {
    if (activeTab === "saved") loadMaterials()
  }, [filterLexile, activeTab, loadMaterials])

  // ----------------------------------------------------------
  // 자료 생성
  // ----------------------------------------------------------

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("주제를 입력해주세요.")
      return
    }

    setGenerating(true)
    setError("")
    setGeneratedMaterial(null)
    setSelectedAnswers({})
    setQuizSubmitted(false)
    setQuizScore(null)
    setLogSaved(false)

    try {
      const result = await generateReading({
        lexileLevel,
        topic: topic.trim(),
        wordCount,
        genre,
        model: selectedModel,
      })

      if (result.success && result.material) {
        setGeneratedMaterial(result.material)
      } else {
        setError(result.error || "자료 생성에 실패했습니다.")
      }
    } catch {
      setError("자료 생성 중 오류가 발생했습니다.")
    } finally {
      setGenerating(false)
    }
  }

  // ----------------------------------------------------------
  // 퀴즈 채점
  // ----------------------------------------------------------

  const handleSubmitQuiz = async () => {
    if (!generatedMaterial) return

    const questions = generatedMaterial.questions
    let correct = 0

    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) correct++
    })

    const score = Math.round((correct / questions.length) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)

    // 읽기 기록 자동 저장
    try {
      await saveReadingLog({
        materialId: generatedMaterial.id,
        wordsRead: generatedMaterial.word_count,
        score,
      })
      setLogSaved(true)
    } catch {
      console.error("읽기 기록 저장 실패")
    }
  }

  // ----------------------------------------------------------
  // 렌더링
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-emerald-100 hover:text-white text-sm">
              홈
            </Link>
            <span className="text-emerald-200">/</span>
            <span className="text-sm">다독 프로그램</span>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">다독 프로그램 (Extensive Reading)</h1>
              <p className="text-emerald-100 mt-1">
                AI 기반 Lexile 맞춤 읽기 자료 생성 및 읽기 기록 관리
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI 자료 생성
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              읽기 기록
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              저장된 자료
            </TabsTrigger>
          </TabsList>

          {/* ================================================ */}
          {/* 탭 1: AI 자료 생성 */}
          {/* ================================================ */}
          <TabsContent value="generate">
            <div className="space-y-6">
              {/* Lexile 수준 선택 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lexile 수준 선택</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
                    {LEXILE_LEVELS.map((level) => (
                      <Button
                        key={level}
                        variant={lexileLevel === level ? "default" : "outline"}
                        size="sm"
                        className={
                          lexileLevel === level
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : ""
                        }
                        onClick={() => setLexileLevel(level)}
                      >
                        {level}L
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 주제 입력 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">주제 입력</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="읽기 자료의 주제를 입력하세요..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TOPICS.map((t) => (
                      <Button
                        key={t}
                        variant={topic === t ? "default" : "secondary"}
                        size="sm"
                        className={
                          topic === t
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : ""
                        }
                        onClick={() => setTopic(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 장르 + 단어 수 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">장르 선택</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((g) => (
                        <Button
                          key={g.value}
                          variant={genre === g.value ? "default" : "outline"}
                          size="sm"
                          className={
                            genre === g.value
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : ""
                          }
                          onClick={() => setGenre(g.value)}
                        >
                          {g.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">단어 수 선택</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {WORD_COUNTS.map((wc) => (
                        <Button
                          key={wc}
                          variant={wordCount === wc ? "default" : "outline"}
                          size="sm"
                          className={
                            wordCount === wc
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : ""
                          }
                          onClick={() => setWordCount(wc)}
                        >
                          {wc}단어
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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

              {/* 생성 버튼 */}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    AI가 읽기 자료를 생성하고 있습니다...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    읽기 자료 생성하기
                  </>
                )}
              </Button>

              {/* 에러 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}

              {/* 생성 결과 */}
              {generatedMaterial && (
                <div className="space-y-4">
                  {/* 제목 + 메타 정보 */}
                  <Card className="border-emerald-200">
                    <CardHeader className="bg-emerald-50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-emerald-900">
                          {generatedMaterial.title}
                        </CardTitle>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {generatedMaterial.lexile_level}L
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {generatedMaterial.genre}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {generatedMaterial.word_count}단어
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                        {generatedMaterial.content}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 핵심 어휘 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">핵심 어휘</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {generatedMaterial.vocabulary.map((word, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 이해도 질문 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">이해도 확인 문제</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {generatedMaterial.questions.map((q, qIndex) => (
                        <div key={qIndex} className="space-y-3">
                          <p className="font-medium text-gray-900">
                            {qIndex + 1}. {q.question}
                          </p>
                          <div className="space-y-2 ml-4">
                            {q.options.map((opt, oIndex) => {
                              const isSelected = selectedAnswers[qIndex] === oIndex
                              const isCorrect = q.answer === oIndex
                              let optionStyle = "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"

                              if (quizSubmitted) {
                                if (isCorrect) {
                                  optionStyle = "border-green-500 bg-green-50"
                                } else if (isSelected && !isCorrect) {
                                  optionStyle = "border-red-500 bg-red-50"
                                }
                              } else if (isSelected) {
                                optionStyle = "border-emerald-500 bg-emerald-50"
                              }

                              return (
                                <button
                                  key={oIndex}
                                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors flex items-center gap-3 ${optionStyle}`}
                                  onClick={() => {
                                    if (!quizSubmitted) {
                                      setSelectedAnswers((prev) => ({
                                        ...prev,
                                        [qIndex]: oIndex,
                                      }))
                                    }
                                  }}
                                  disabled={quizSubmitted}
                                >
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium">
                                    {String.fromCharCode(65 + oIndex)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {quizSubmitted && isCorrect && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  )}
                                  {quizSubmitted && isSelected && !isCorrect && (
                                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {/* 채점 버튼 / 결과 */}
                      {!quizSubmitted ? (
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={handleSubmitQuiz}
                          disabled={
                            Object.keys(selectedAnswers).length !==
                            generatedMaterial.questions.length
                          }
                        >
                          채점하기
                        </Button>
                      ) : (
                        <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-6 text-center space-y-2">
                          <Trophy className="h-10 w-10 text-emerald-600 mx-auto" />
                          <p className="text-2xl font-bold text-emerald-700">
                            {quizScore}점
                          </p>
                          <p className="text-gray-600">
                            {generatedMaterial.questions.length}문제 중{" "}
                            {Math.round(
                              (quizScore! / 100) *
                                generatedMaterial.questions.length
                            )}
                            문제 정답
                          </p>
                          {logSaved && (
                            <p className="text-sm text-emerald-600 flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              읽기 기록이 자동으로 저장되었습니다.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ================================================ */}
          {/* 탭 2: 읽기 기록 */}
          {/* ================================================ */}
          <TabsContent value="history">
            {loadingStats ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : stats ? (
              <div className="space-y-6" id="export-reading-stats">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => exportToPDF("export-reading-stats", "reading-stats.pdf")}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF 다운로드
                  </button>
                </div>
                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-emerald-100">
                          <BookOpen className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">총 읽은 단어 수</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.totalWordsRead.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-blue-100">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">읽은 자료 수</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.totalMaterialsRead}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-amber-100">
                          <Trophy className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">평균 이해도 점수</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stats.averageScore}점
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 목표 프로그레스 바 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-emerald-600" />
                      연간 읽기 목표
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {stats.totalWordsRead.toLocaleString()} / {YEARLY_WORD_GOAL.toLocaleString()} 단어
                      </span>
                      <span className="font-medium text-emerald-600">
                        {Math.min(
                          Math.round((stats.totalWordsRead / YEARLY_WORD_GOAL) * 100),
                          100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        (stats.totalWordsRead / YEARLY_WORD_GOAL) * 100,
                        100
                      )}
                      className="h-3"
                    />
                    <p className="text-xs text-gray-500">
                      목표까지{" "}
                      {Math.max(
                        YEARLY_WORD_GOAL - stats.totalWordsRead,
                        0
                      ).toLocaleString()}{" "}
                      단어 남음
                    </p>
                  </CardContent>
                </Card>

                {/* 최근 읽기 기록 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">최근 읽기 기록</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.logs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        아직 읽기 기록이 없습니다. AI 자료 생성 탭에서 읽기를 시작해보세요!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {stats.logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-4 w-4 text-emerald-600" />
                              <div>
                                <p className="font-medium text-sm text-gray-900">
                                  {log.title || `자료 #${log.material_id}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(log.created_at).toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                {log.words_read.toLocaleString()}단어
                              </span>
                              <span
                                className={`font-medium ${
                                  log.score >= 80
                                    ? "text-green-600"
                                    : log.score >= 50
                                      ? "text-amber-600"
                                      : "text-red-600"
                                }`}
                              >
                                {log.score}점
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                데이터를 불러올 수 없습니다.
              </div>
            )}
          </TabsContent>

          {/* ================================================ */}
          {/* 탭 3: 저장된 자료 */}
          {/* ================================================ */}
          <TabsContent value="saved">
            <div className="space-y-4">
              {/* Lexile 필터 */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 mr-2">
                      Lexile 필터:
                    </span>
                    <Button
                      variant={filterLexile === null ? "default" : "outline"}
                      size="sm"
                      className={
                        filterLexile === null
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : ""
                      }
                      onClick={() => setFilterLexile(null)}
                    >
                      전체
                    </Button>
                    {LEXILE_LEVELS.map((level) => (
                      <Button
                        key={level}
                        variant={filterLexile === level ? "default" : "outline"}
                        size="sm"
                        className={
                          filterLexile === level
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : ""
                        }
                        onClick={() => setFilterLexile(level)}
                      >
                        {level}L
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 자료 목록 */}
              {loadingMaterials ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : savedMaterials.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {filterLexile
                        ? `${filterLexile}L에 해당하는 저장된 자료가 없습니다.`
                        : "아직 저장된 읽기 자료가 없습니다."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {savedMaterials.map((material) => {
                    const isExpanded = expandedId === material.id

                    return (
                      <Card
                        key={material.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardHeader
                          className="pb-2"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : material.id)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {material.title}
                            </CardTitle>
                            <div className="flex gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {material.lexile_level}L
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {material.genre}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {material.word_count}단어
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(material.created_at).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}{" "}
                            | 주제: {material.topic}
                          </p>
                        </CardHeader>

                        {isExpanded && (
                          <CardContent className="pt-2 space-y-4">
                            {/* 본문 */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                                {material.content}
                              </p>
                            </div>

                            {/* 어휘 */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                핵심 어휘
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {material.vocabulary.map((word, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800"
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 질문 */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                이해도 확인 문제
                              </p>
                              <div className="space-y-3">
                                {material.questions.map((q, qi) => (
                                  <div key={qi} className="space-y-1">
                                    <p className="text-sm font-medium">
                                      {qi + 1}. {q.question}
                                    </p>
                                    <div className="ml-4 space-y-1">
                                      {q.options.map((opt, oi) => (
                                        <p
                                          key={oi}
                                          className={`text-sm ${
                                            q.answer === oi
                                              ? "text-emerald-700 font-medium"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          {String.fromCharCode(65 + oi)}. {opt}
                                          {q.answer === oi && (
                                            <CheckCircle2 className="inline h-4 w-4 ml-1 text-emerald-600" />
                                          )}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

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
  Trash2,
  ChevronDown,
  ChevronUp,
  Code2,
} from "lucide-react"
import Link from "next/link"
import { createCsatItem, getCsatItems, deleteCsatItem } from "@/app/actions/csat"
import type { CsatItem } from "@/lib/turso"

const ITEM_TYPES = [
  "빈칸추론",
  "순서배열",
  "요약완성",
  "심경분위기",
  "주제요지",
  "지칭추론",
  "무관한문장",
]

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "쉬움 (700-800L)", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "중간 (850-1000L)", color: "bg-yellow-100 text-yellow-800" },
  { value: "hard", label: "어려움 (1000-1200L)", color: "bg-red-100 text-red-800" },
]

const LEXILE_PRESETS: Record<string, number> = {
  easy: 750,
  medium: 900,
  hard: 1100,
}

export default function CSATQuestionGeneration() {
  const [activeTab, setActiveTab] = useState("generate")

  // 생성 폼 상태
  const [selectedType, setSelectedType] = useState("빈칸추론")
  const [inputMode, setInputMode] = useState<"passage" | "topic">("topic")
  const [passage, setPassage] = useState("")
  const [topic, setTopic] = useState("")
  const [difficulty, setDifficulty] = useState("medium")
  const [selectedModel, setSelectedModel] = useState<ModelName>("gemini-flash")
  const [generating, setGenerating] = useState(false)
  const [generatedItem, setGeneratedItem] = useState<CsatItem | null>(null)
  const [error, setError] = useState("")

  // 저장된 문항 목록 상태
  const [savedItems, setSavedItems] = useState<CsatItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const handleGenerate = async () => {
    if (inputMode === "passage" && !passage.trim()) {
      setError("지문을 입력해주세요.")
      return
    }
    if (inputMode === "topic" && !topic.trim()) {
      setError("주제를 입력해주세요.")
      return
    }

    setGenerating(true)
    setError("")
    setGeneratedItem(null)

    try {
      const result = await Promise.race([
        createCsatItem({
          type: selectedType,
          passage: inputMode === "passage" ? passage : undefined,
          topic: inputMode === "topic" ? topic : undefined,
          lexileLevel: LEXILE_PRESETS[difficulty],
          difficulty,
          model: selectedModel,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 60000)),
      ])

      if (result.success && result.item) {
        setGeneratedItem(result.item)
      } else {
        setError(result.error || "문항 생성에 실패했습니다.")
      }
    } catch (e) {
      setError("AI 응답 시간이 초과되었습니다. 다시 시도해주세요.")
    } finally {
      setGenerating(false)
    }
  }

  const loadSavedItems = async () => {
    setLoadingItems(true)
    const items = await getCsatItems({ limit: 30 })
    setSavedItems(items)
    setLoadingItems(false)
  }

  const handleDelete = async (id: number) => {
    const result = await deleteCsatItem(id)
    if (result.success) {
      setSavedItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const difficultyColor = (d?: string) =>
    DIFFICULTY_OPTIONS.find((o) => o.value === d)?.color ?? "bg-gray-100 text-gray-700"

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
                <Sparkles className="h-5 w-5 text-purple-600" />
                수능 문항 생성 AI
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">Claude AI가 수능 스타일 영어 문항을 생성합니다</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/vocabulary-list">어휘 리스트</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v)
          if (v === "saved") loadSavedItems()
        }}>
          <TabsList className="mb-6">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI 문항 생성
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <BookOpen className="h-4 w-4" />
              저장된 문항
            </TabsTrigger>
            <TabsTrigger value="guide" className="gap-2">
              <Code2 className="h-4 w-4" />
              출제 원칙
            </TabsTrigger>
          </TabsList>

          {/* ── AI 문항 생성 탭 ── */}
          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 왼쪽: 입력 패널 */}
              <Card>
                <CardHeader>
                  <CardTitle>문항 설정</CardTitle>
                  <CardDescription>조건을 설정하고 AI로 수능 문항을 생성합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* 문항 유형 */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">문항 유형</Label>
                    <div className="flex flex-wrap gap-2">
                      {ITEM_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedType(type)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            selectedType === type
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-white text-slate-600 border-slate-300 hover:border-purple-400"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 난이도 */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">난이도</Label>
                    <div className="flex gap-2">
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDifficulty(opt.value)}
                          className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                            difficulty === opt.value
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-white text-slate-600 border-slate-300 hover:border-purple-400"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 입력 모드 */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">지문 방식</Label>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setInputMode("topic")}
                        className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                          inputMode === "topic"
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-600 border-slate-300"
                        }`}
                      >
                        주제로 자동 생성
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode("passage")}
                        className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                          inputMode === "passage"
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-600 border-slate-300"
                        }`}
                      >
                        지문 직접 입력
                      </button>
                    </div>

                    {inputMode === "topic" ? (
                      <div>
                        <Label htmlFor="topic" className="text-xs text-slate-500 mb-1 block">
                          주제 (예: 환경 보호, 인공지능 윤리, 문화 다양성)
                        </Label>
                        <Input
                          id="topic"
                          placeholder="주제를 입력하세요..."
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="passage" className="text-xs text-slate-500 mb-1 block">
                          영어 지문 붙여넣기
                        </Label>
                        <textarea
                          id="passage"
                          className="w-full h-40 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                          placeholder="영어 지문을 붙여넣으세요..."
                          value={passage}
                          onChange={(e) => setPassage(e.target.value)}
                        />
                      </div>
                    )}
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
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        AI가 문항을 생성하는 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        문항 생성하기
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 오른쪽: 결과 패널 */}
              <div className="space-y-4">
                {generating && (
                  <Card className="border-purple-200">
                    <CardContent className="flex items-center justify-center py-16">
                      <div className="text-center space-y-3">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
                        <p className="text-slate-600">Claude AI가 문항을 생성하고 있습니다...</p>
                        <p className="text-xs text-slate-400">수능 기준에 맞는 지문과 선택지를 작성 중</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {generatedItem && !generating && (
                  <>
                    <Card className="border-purple-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">생성된 문항</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline">{generatedItem.type}</Badge>
                            <Badge className={difficultyColor(generatedItem.difficulty)}>
                              {DIFFICULTY_OPTIONS.find((o) => o.value === generatedItem.difficulty)?.label ?? generatedItem.difficulty}
                            </Badge>
                            {generatedItem.lexile_level && (
                              <Badge variant="outline">{generatedItem.lexile_level}L</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 지문 */}
                        <div className="p-4 bg-slate-50 rounded-lg border text-sm leading-relaxed">
                          <p className="font-medium text-xs text-slate-400 mb-2">지문</p>
                          {generatedItem.passage}
                        </div>

                        {/* 문항 */}
                        <div>
                          <p className="font-medium text-sm mb-2">{generatedItem.question}</p>
                          <ol className="space-y-1.5">
                            {generatedItem.options.map((opt, idx) => (
                              <li
                                key={idx}
                                className={`p-2 rounded text-sm border ${
                                  idx + 1 === generatedItem.answer
                                    ? "bg-green-50 border-green-300 font-medium text-green-800"
                                    : "bg-white border-slate-200"
                                }`}
                              >
                                {opt}
                                {idx + 1 === generatedItem.answer && (
                                  <span className="ml-2 text-xs text-green-600">✓ 정답</span>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 해설 */}
                    {generatedItem.ai_analysis && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-slate-600">풀이 해설</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {generatedItem.ai_analysis}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <p className="text-xs text-slate-400 text-center">
                      문항은 자동으로 DB에 저장되었습니다.{" "}
                      <button
                        type="button"
                        className="text-purple-600 underline"
                        onClick={() => { setActiveTab("saved"); loadSavedItems() }}
                      >
                        저장된 문항 보기
                      </button>
                    </p>
                  </>
                )}

                {!generating && !generatedItem && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-16 text-center">
                      <div className="space-y-2">
                        <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
                        <p className="text-slate-400 text-sm">왼쪽에서 조건을 설정하고<br />문항 생성 버튼을 누르세요</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── 저장된 문항 탭 ── */}
          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>저장된 문항 목록</CardTitle>
                    <CardDescription>AI가 생성하고 DB에 저장된 수능 문항입니다</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadSavedItems} disabled={loadingItems}>
                    {loadingItems ? <Loader2 className="h-4 w-4 animate-spin" /> : "새로고침"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingItems && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                )}
                {!loadingItems && savedItems.length === 0 && (
                  <p className="text-center text-slate-400 py-10">저장된 문항이 없습니다. AI 문항 생성 탭에서 문항을 생성해보세요.</p>
                )}
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge className={difficultyColor(item.difficulty)}>
                            {DIFFICULTY_OPTIONS.find((o) => o.value === item.difficulty)?.label ?? item.difficulty}
                          </Badge>
                          {item.lexile_level && <Badge variant="outline">{item.lexile_level}L</Badge>}
                          <span className="text-sm text-slate-600 line-clamp-1 max-w-xs">
                            {item.question}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {item.created_at.slice(0, 10)}
                          </span>
                          <button
                            type="button"
                            aria-label="문항 삭제"
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {expandedId === item.id
                            ? <ChevronUp className="h-4 w-4 text-slate-400" />
                            : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </div>

                      {expandedId === item.id && (
                        <div className="border-t p-4 space-y-4 bg-slate-50">
                          <div className="p-3 bg-white rounded border text-sm leading-relaxed">
                            <p className="text-xs text-slate-400 mb-1 font-medium">지문</p>
                            {item.passage}
                          </div>
                          <div>
                            <p className="font-medium text-sm mb-2">{item.question}</p>
                            <ol className="space-y-1.5">
                              {item.options.map((opt, idx) => (
                                <li
                                  key={idx}
                                  className={`p-2 rounded text-sm border ${
                                    idx + 1 === item.answer
                                      ? "bg-green-50 border-green-300 font-medium text-green-800"
                                      : "bg-white border-slate-200"
                                  }`}
                                >
                                  {opt}
                                  {idx + 1 === item.answer && (
                                    <span className="ml-2 text-xs text-green-600">✓ 정답</span>
                                  )}
                                </li>
                              ))}
                            </ol>
                          </div>
                          {item.ai_analysis && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-100">
                              <p className="text-xs font-medium text-blue-700 mb-1">풀이 해설</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.ai_analysis}</p>
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

          {/* ── 출제 원칙 탭 (기존 내용 유지) ── */}
          <TabsContent value="guide">
            <Card>
              <CardHeader>
                <CardTitle>수능 문항 출제 4대 원칙</CardTitle>
                <CardDescription>김용명(2010) 검사지 구성 원칙 해설</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800", heading: "text-purple-800", title: "1. 상보성 (Complementarity)", icon: "샐러드", desc: "다양한 문항 유형을 골고루 포함해 학생의 다양한 영어 능력을 균형 있게 평가합니다." },
                    { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", heading: "text-blue-800", title: "2. 통합성 (Integration)", icon: "운동 경기", desc: "듣기·읽기·말하기·쓰기 등 여러 기능이 통합된 문항으로 실제 언어 사용 능력을 평가합니다." },
                    { bg: "bg-teal-50", border: "border-teal-200", badge: "bg-teal-100 text-teal-800", heading: "text-teal-800", title: "3. 주축성 (Pivotality)", icon: "자전거 바퀴", desc: "변별력 높은 주축 문항과 다양성을 확보하는 주변 문항을 균형 있게 구성합니다." },
                    { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800", heading: "text-amber-800", title: "4. 위계성 (Hierarchicality)", icon: "계단 오르기", desc: "쉬운 문항(L형)부터 어려운 문항(H형)까지 단계적으로 배치해 모든 수준의 학생을 평가합니다." },
                  ].map((item) => (
                    <div key={item.title} className={`p-4 rounded-lg border ${item.bg} ${item.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${item.badge} px-2 py-0.5 rounded text-xs font-medium`}>
                          {item.icon}
                        </span>
                        <h3 className={`font-semibold ${item.heading} text-sm`}>{item.title}</h3>
                      </div>
                      <p className="text-sm text-slate-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-xs text-slate-500 border-t pt-4">
                  <p className="font-medium mb-1">참고문헌</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>김용명(2010). 영어 평가 검사지 구성 원칙에 관한 연구.</li>
                    <li>한국교육과정평가원. 수능 영어 영역 출제 방향.</li>
                    <li>교육부. 2022 개정 교육과정.</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

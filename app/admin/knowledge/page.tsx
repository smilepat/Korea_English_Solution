"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  Loader2,
  Sparkles,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  Tag,
} from "lucide-react"
import {
  getKnowledgeDocuments,
  addKnowledgeDocument,
  searchKnowledgeDocuments,
  getCurriculumStandards,
} from "@/app/actions/knowledge"
import type { KnowledgeDocument, CurriculumStandard } from "@/lib/turso"

// ── 상수 정의 ──────────────────────────────────────────────

const DOC_TYPES = [
  { value: "curriculum", label: "교육과정", color: "bg-blue-100 text-blue-800" },
  { value: "research", label: "연구자료", color: "bg-purple-100 text-purple-800" },
  { value: "news", label: "뉴스", color: "bg-green-100 text-green-800" },
  { value: "lesson", label: "수업사례", color: "bg-orange-100 text-orange-800" },
  { value: "policy", label: "정책", color: "bg-red-100 text-red-800" },
  { value: "csat", label: "수능", color: "bg-yellow-100 text-yellow-800" },
] as const

const EDU_LEVELS = [
  { value: "elementary", label: "초등" },
  { value: "middle", label: "중등" },
  { value: "high", label: "고등" },
  { value: "all", label: "전체" },
] as const

const SKILLS = [
  { value: "reading", label: "읽기" },
  { value: "writing", label: "쓰기" },
  { value: "listening", label: "듣기" },
  { value: "speaking", label: "말하기" },
  { value: "all", label: "전체" },
] as const

function getTypeInfo(type: string) {
  return DOC_TYPES.find((t) => t.value === type) ?? { value: type, label: type, color: "bg-gray-100 text-gray-800" }
}

function getEduLevelLabel(level: string) {
  return EDU_LEVELS.find((l) => l.value === level)?.label ?? level
}

function getSkillLabel(skill: string) {
  return SKILLS.find((s) => s.value === skill)?.label ?? skill
}

// ── 메인 페이지 ────────────────────────────────────────────

export default function KnowledgeAdminPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-gray-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">지식 DB 관리</h1>
              <p className="mt-1 text-sm text-slate-300">
                영어교육 지식 데이터베이스를 관리하고 AI 자동 분석 결과를 확인합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              문서 관리
            </TabsTrigger>
            <TabsTrigger value="standards" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              성취기준 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <DocumentsTab />
          </TabsContent>

          <TabsContent value="standards">
            <StandardsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ── 문서 관리 탭 ───────────────────────────────────────────

function DocumentsTab() {
  // 폼 상태
  const [title, setTitle] = useState("")
  const [type, setType] = useState<KnowledgeDocument["type"]>("curriculum")
  const [eduLevel, setEduLevel] = useState<NonNullable<KnowledgeDocument["edu_level"]>>("all")
  const [skill, setSkill] = useState<NonNullable<KnowledgeDocument["skill"]>>("all")
  const [content, setContent] = useState("")
  const [source, setSource] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // 목록 상태
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("")
  const [filterEduLevel, setFilterEduLevel] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: { type?: string; edu_level?: string } = {}
      if (filterType) params.type = filterType
      if (filterEduLevel) params.edu_level = filterEduLevel
      const docs = await getKnowledgeDocuments(params)
      setDocuments(docs)
    } catch {
      console.error("문서 로드 실패")
    } finally {
      setIsLoading(false)
    }
  }, [filterType, filterEduLevel])

  useEffect(() => {
    if (!searchQuery) {
      loadDocuments()
    }
  }, [loadDocuments, searchQuery])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments()
      return
    }
    setIsLoading(true)
    try {
      const results = await searchKnowledgeDocuments(searchQuery)
      setDocuments(results)
    } catch {
      console.error("검색 실패")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setSaveMessage({ type: "error", text: "제목과 내용을 입력해 주세요." })
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const result = await addKnowledgeDocument({
        type,
        title: title.trim(),
        content: content.trim(),
        source: source.trim() || undefined,
        edu_level: eduLevel,
        skill,
      })

      if (result.success) {
        setSaveMessage({ type: "success", text: "문서가 AI 처리와 함께 저장되었습니다." })
        setTitle("")
        setContent("")
        setSource("")
        setType("curriculum")
        setEduLevel("all")
        setSkill("all")
        loadDocuments()
      } else {
        setSaveMessage({ type: "error", text: result.error ?? "저장 중 오류가 발생했습니다." })
      }
    } catch {
      setSaveMessage({ type: "error", text: "저장 중 오류가 발생했습니다." })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* 문서 추가 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            새 문서 추가
          </CardTitle>
          <CardDescription>
            문서를 입력하면 AI가 자동으로 요약, 키워드, 교육적 함의를 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">제목</label>
            <Input
              placeholder="문서 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* 유형 선택 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">유형</label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  size="sm"
                  variant={type === t.value ? "default" : "outline"}
                  onClick={() => setType(t.value as KnowledgeDocument["type"])}
                  disabled={isSaving}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 학교급 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">학교급</label>
            <div className="flex flex-wrap gap-2">
              {EDU_LEVELS.map((l) => (
                <Button
                  key={l.value}
                  type="button"
                  size="sm"
                  variant={eduLevel === l.value ? "default" : "outline"}
                  onClick={() => setEduLevel(l.value as NonNullable<KnowledgeDocument["edu_level"]>)}
                  disabled={isSaving}
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 기능 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">기능</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <Button
                  key={s.value}
                  type="button"
                  size="sm"
                  variant={skill === s.value ? "default" : "outline"}
                  onClick={() => setSkill(s.value as NonNullable<KnowledgeDocument["skill"]>)}
                  disabled={isSaving}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">내용</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={6}
              placeholder="문서 내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* 출처 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">출처 (선택)</label>
            <Input
              placeholder="출처 URL 또는 참고문헌"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* 저장 버튼 */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI 처리 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI 처리 후 저장
                </>
              )}
            </Button>
            {saveMessage && (
              <p
                className={`text-sm ${
                  saveMessage.type === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {saveMessage.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 문서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            문서 목록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 행 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 유형 필터 */}
            <Button
              size="sm"
              variant={filterType === "" ? "default" : "outline"}
              onClick={() => setFilterType("")}
            >
              전체
            </Button>
            {DOC_TYPES.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant={filterType === t.value ? "default" : "outline"}
                onClick={() => setFilterType(t.value)}
              >
                {t.label}
              </Button>
            ))}

            <div className="mx-2 h-6 w-px bg-gray-300" />

            {/* 학교급 필터 */}
            <Button
              size="sm"
              variant={filterEduLevel === "" ? "secondary" : "outline"}
              onClick={() => setFilterEduLevel("")}
            >
              학교급 전체
            </Button>
            {EDU_LEVELS.filter((l) => l.value !== "all").map((l) => (
              <Button
                key={l.value}
                size="sm"
                variant={filterEduLevel === l.value ? "secondary" : "outline"}
                onClick={() => setFilterEduLevel(l.value)}
              >
                {l.label}
              </Button>
            ))}

            <div className="mx-2 h-6 w-px bg-gray-300" />

            {/* 검색 */}
            <div className="flex items-center gap-1">
              <Input
                placeholder="검색어 입력"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-9 w-48"
              />
              <Button size="sm" variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">불러오는 중...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              등록된 문서가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const typeInfo = getTypeInfo(doc.type)
                const isExpanded = expandedIds.has(doc.id)

                return (
                  <div
                    key={doc.id}
                    className="rounded-lg border bg-white transition-shadow hover:shadow-sm"
                  >
                    {/* 헤더 (항상 보임) */}
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                      onClick={() => toggleExpand(doc.id)}
                    >
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{doc.title}</span>
                        <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                        {doc.edu_level && (
                          <Badge variant="outline">{getEduLevelLabel(doc.edu_level)}</Badge>
                        )}
                        {doc.skill && doc.skill !== "all" && (
                          <Badge variant="secondary">{getSkillLabel(doc.skill)}</Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          {doc.created_at?.slice(0, 10)}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                      )}
                    </button>

                    {/* 확장 콘텐츠 */}
                    {isExpanded && (
                      <div className="space-y-3 border-t px-4 py-4">
                        {/* 원문 */}
                        <div>
                          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            내용
                          </h4>
                          <p className="whitespace-pre-wrap text-sm text-gray-700">{doc.content}</p>
                        </div>

                        {doc.source && (
                          <div>
                            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              출처
                            </h4>
                            <p className="text-sm text-gray-600">{doc.source}</p>
                          </div>
                        )}

                        {/* AI 요약 */}
                        {doc.ai_summary && (
                          <div className="rounded-md bg-blue-50 p-3">
                            <h4 className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                              <Sparkles className="h-3 w-3" />
                              AI 요약
                            </h4>
                            <p className="text-sm text-blue-900">{doc.ai_summary}</p>
                          </div>
                        )}

                        {/* AI 교육적 함의 */}
                        {doc.ai_implications && (
                          <div className="rounded-md bg-amber-50 p-3">
                            <h4 className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                              <Sparkles className="h-3 w-3" />
                              교육적 함의
                            </h4>
                            <p className="text-sm text-amber-900">{doc.ai_implications}</p>
                          </div>
                        )}

                        {/* 키워드 */}
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div>
                            <h4 className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              <Tag className="h-3 w-3" />
                              키워드
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {doc.keywords.map((kw, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── 성취기준 관리 탭 ───────────────────────────────────────

function StandardsTab() {
  const [standards, setStandards] = useState<CurriculumStandard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterGrade, setFilterGrade] = useState("")
  const [filterSkill, setFilterSkill] = useState("")

  const loadStandards = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: { grade?: string; skill?: string } = {}
      if (filterGrade) params.grade = filterGrade
      if (filterSkill) params.skill = filterSkill
      const data = await getCurriculumStandards(params)
      setStandards(data)
    } catch {
      console.error("성취기준 로드 실패")
    } finally {
      setIsLoading(false)
    }
  }, [filterGrade, filterSkill])

  useEffect(() => {
    loadStandards()
  }, [loadStandards])

  const GRADES = [
    { value: "3", label: "3학년" },
    { value: "4", label: "4학년" },
    { value: "5", label: "5학년" },
    { value: "6", label: "6학년" },
    { value: "7", label: "중1" },
    { value: "8", label: "중2" },
    { value: "9", label: "중3" },
    { value: "10", label: "고1" },
    { value: "11", label: "고2" },
    { value: "12", label: "고3" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            교육과정 성취기준
          </CardTitle>
          <CardDescription>
            교육과정별 영어 성취기준을 조회합니다. (읽기 전용)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">학년:</span>
            <Button
              size="sm"
              variant={filterGrade === "" ? "default" : "outline"}
              onClick={() => setFilterGrade("")}
            >
              전체
            </Button>
            {GRADES.map((g) => (
              <Button
                key={g.value}
                size="sm"
                variant={filterGrade === g.value ? "default" : "outline"}
                onClick={() => setFilterGrade(g.value)}
              >
                {g.label}
              </Button>
            ))}

            <div className="mx-2 h-6 w-px bg-gray-300" />

            <span className="text-sm font-medium text-gray-600">기능:</span>
            <Button
              size="sm"
              variant={filterSkill === "" ? "secondary" : "outline"}
              onClick={() => setFilterSkill("")}
            >
              전체
            </Button>
            {SKILLS.filter((s) => s.value !== "all").map((s) => (
              <Button
                key={s.value}
                size="sm"
                variant={filterSkill === s.value ? "secondary" : "outline"}
                onClick={() => setFilterSkill(s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          {/* 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">불러오는 중...</span>
            </div>
          ) : standards.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              조건에 맞는 성취기준이 없습니다.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
              {standards.map((std) => (
                <Card key={std.id} className="border shadow-sm">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-slate-700 text-white">{std.curriculum}</Badge>
                      <Badge variant="outline">{std.grade}학년</Badge>
                      <Badge variant="secondary">{getSkillLabel(std.skill)}</Badge>
                      {std.cefr_level && (
                        <Badge className="bg-indigo-100 text-indigo-800">CEFR {std.cefr_level}</Badge>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-gray-800">{std.description}</p>

                    {(std.lexile_min != null || std.lexile_max != null) && (
                      <p className="text-xs text-gray-500">
                        Lexile: {std.lexile_min ?? "?"}L ~ {std.lexile_max ?? "?"}L
                      </p>
                    )}

                    {std.keywords && std.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {std.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

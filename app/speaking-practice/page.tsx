"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Loader2, Sparkles, Trophy, ChevronDown, ChevronUp, X } from "lucide-react"
import {
  startConversationAction,
  sendMessage,
  endConversation,
  getConversationHistory,
} from "@/app/actions/speaking"

// ============================================================
// 타입 정의
// ============================================================

interface Message {
  role: "student" | "ai"
  content: string
  feedback?: {
    corrections: string[]
    suggestions: string[]
    encouragement: string
  }
}

interface Evaluation {
  fluency: number
  accuracy: number
  vocabulary: number
  taskCompletion: number
  overall: string
  strengths: string[]
  improvements: string[]
}

interface PastSession {
  id: number
  scenario: string
  cefrLevel: string
  fluency: number
  accuracy: number
  vocabulary: number
  taskCompletion: number
  createdAt: string
}

interface Scenario {
  name: string
  level: string
}

// ============================================================
// 시나리오 데이터
// ============================================================

const SCENARIO_CATEGORIES: Record<string, Scenario[]> = {
  일상생활: [
    { name: "카페에서 주문하기", level: "A1" },
    { name: "길 안내하기", level: "A1" },
    { name: "병원 예약하기", level: "A2" },
  ],
  학교생활: [
    { name: "동아리 가입 상담", level: "A2" },
    { name: "과제 토론", level: "B1" },
    { name: "유학 상담", level: "B1" },
  ],
  의견표현: [
    { name: "교복 착용 찬반", level: "B1" },
    { name: "온라인 수업 vs 대면 수업", level: "B1" },
  ],
  학술토론: [
    { name: "기후변화 해결책", level: "B2" },
    { name: "AI 윤리", level: "B2" },
  ],
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2"] as const

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-100 text-emerald-700",
  A2: "bg-blue-100 text-blue-700",
  B1: "bg-amber-100 text-amber-700",
  B2: "bg-red-100 text-red-700",
}

// ============================================================
// 페이지 컴포넌트
// ============================================================

export default function SpeakingPracticePage() {
  const [selectedLevel, setSelectedLevel] = useState<string>("A1")
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [pastSessions, setPastSessions] = useState<PastSession[]>([])
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 대화 기록 로드
  useEffect(() => {
    async function loadHistory() {
      const result = await getConversationHistory()
      if (result.success && result.sessions) {
        setPastSessions(result.sessions)
      }
    }
    loadHistory()
  }, [])

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 시나리오 선택 및 대화 시작
  const handleSelectScenario = useCallback(async (scenario: string, level: string) => {
    setSelectedScenario(scenario)
    setSelectedLevel(level)
    setMessages([])
    setEvaluation(null)
    setIsStarting(true)

    const result = await startConversationAction({ scenario, cefrLevel: level })
    if (result.success && result.greeting) {
      setMessages([{ role: "ai", content: result.greeting }])
    }
    setIsStarting(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // 메시지 전송
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !selectedScenario || isLoading) return

    const studentMessage: Message = { role: "student", content: inputValue.trim() }
    const updatedMessages = [...messages, studentMessage]
    setMessages(updatedMessages)
    setInputValue("")
    setIsLoading(true)

    const result = await sendMessage({
      scenario: selectedScenario,
      cefrLevel: selectedLevel,
      messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      studentInput: studentMessage.content,
    })

    if (result.success && result.response) {
      const aiMessage: Message = {
        role: "ai",
        content: result.response,
        feedback: result.feedback,
      }
      setMessages((prev) => [...prev, aiMessage])
    }
    setIsLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [inputValue, selectedScenario, selectedLevel, messages, isLoading])

  // 대화 종료
  const handleEndConversation = useCallback(async () => {
    if (!selectedScenario || messages.length < 2) return
    setIsEnding(true)

    const result = await endConversation({
      scenario: selectedScenario,
      cefrLevel: selectedLevel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    if (result.success && result.evaluation) {
      setEvaluation(result.evaluation)
      // 기록 갱신
      const historyResult = await getConversationHistory()
      if (historyResult.success && historyResult.sessions) {
        setPastSessions(historyResult.sessions)
      }
    }
    setIsEnding(false)
  }, [selectedScenario, selectedLevel, messages])

  // 새 대화 시작
  const handleNewConversation = useCallback(() => {
    setSelectedScenario(null)
    setMessages([])
    setEvaluation(null)
    setInputValue("")
  }, [])

  // 피드백 토글
  const toggleFeedback = useCallback((index: number) => {
    setExpandedFeedback((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  // Enter 키 처리
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  // ============================================================
  // 평가 결과 화면
  // ============================================================

  if (evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">대화 평가 결과</CardTitle>
                <p className="text-violet-100 mt-1">
                  {selectedScenario} ({selectedLevel})
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* 점수 바 */}
            <div className="space-y-4">
              {[
                { label: "유창성", value: evaluation.fluency, color: "bg-blue-500" },
                { label: "정확성", value: evaluation.accuracy, color: "bg-green-500" },
                { label: "어휘력", value: evaluation.vocabulary, color: "bg-amber-500" },
                { label: "과제완수도", value: evaluation.taskCompletion, color: "bg-purple-500" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{item.label}</span>
                    <span className="text-slate-600">{item.value}점</span>
                  </div>
                  <div className="relative">
                    <Progress value={item.value} className="h-3" />
                  </div>
                </div>
              ))}
            </div>

            {/* 잘한 점 */}
            {evaluation.strengths.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">잘한 점</h3>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-green-700 text-sm flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개선할 점 */}
            {evaluation.improvements.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">개선할 점</h3>
                <ul className="space-y-1">
                  {evaluation.improvements.map((s, i) => (
                    <li key={i} className="text-orange-700 text-sm flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 전체 평가 요약 */}
            <div className="bg-slate-50 border rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">전체 평가 요약</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{evaluation.overall}</p>
            </div>

            <Button
              onClick={handleNewConversation}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              새 대화 시작
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // 메인 레이아웃
  // ============================================================

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 왼쪽 사이드바 */}
      <aside className="w-80 border-r bg-white flex flex-col shrink-0">
        {/* 헤더 */}
        <div className="p-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h1 className="font-bold text-lg">AI 영어 대화 연습</h1>
          </div>
          <p className="text-violet-100 text-xs mt-1">Speaking Practice</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* CEFR 레벨 선택 */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                CEFR 레벨
              </h2>
              <div className="grid grid-cols-4 gap-1.5">
                {CEFR_LEVELS.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    className={
                      selectedLevel === level
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : ""
                    }
                    onClick={() => setSelectedLevel(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* 시나리오 카테고리 */}
            {Object.entries(SCENARIO_CATEGORIES).map(([category, scenarios]) => {
              const filteredScenarios = scenarios.filter(
                (s) => s.level === selectedLevel || selectedLevel === s.level,
              )
              if (filteredScenarios.length === 0) return null

              return (
                <div key={category}>
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {category}
                  </h2>
                  <div className="space-y-1.5">
                    {filteredScenarios.map((scenario) => (
                      <button
                        key={scenario.name}
                        onClick={() => handleSelectScenario(scenario.name, scenario.level)}
                        className={`w-full text-left p-3 rounded-lg border transition-all text-sm hover:shadow-sm ${
                          selectedScenario === scenario.name
                            ? "border-violet-300 bg-violet-50 shadow-sm"
                            : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/50"
                        }`}
                      >
                        <div className="font-medium text-slate-800">{scenario.name}</div>
                        <span
                          className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[scenario.level]}`}
                        >
                          {scenario.level}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* 대화 기록 */}
            {pastSessions.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  대화 기록
                </h2>
                <div className="space-y-1.5">
                  {pastSessions.map((session) => {
                    const avg = Math.round(
                      (session.fluency + session.accuracy + session.vocabulary + session.taskCompletion) / 4,
                    )
                    return (
                      <div
                        key={session.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                      >
                        <div className="font-medium text-slate-700">{session.scenario}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[session.cefrLevel] || "bg-slate-100 text-slate-600"}`}
                          >
                            {session.cefrLevel}
                          </span>
                          <span className="text-xs text-slate-500">평균 {avg}점</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(session.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedScenario ? (
          <>
            {/* 상단 바 */}
            <div className="h-14 border-b bg-white px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-800">{selectedScenario}</h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[selectedLevel]}`}
                >
                  {selectedLevel}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndConversation}
                disabled={messages.length < 2 || isEnding}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                {isEnding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    평가 중...
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    대화 종료
                  </>
                )}
              </Button>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isStarting && (
                <div className="flex justify-center py-12">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>대화를 준비하고 있습니다...</span>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index}>
                  <div
                    className={`flex ${message.role === "student" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === "student"
                          ? "bg-green-500 text-white rounded-br-md"
                          : "bg-blue-500 text-white rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>

                  {/* 피드백 패널 (AI 메시지 아래) */}
                  {message.role === "ai" && message.feedback && (
                    <div className="mt-1.5 ml-0 max-w-[70%]">
                      <button
                        onClick={() => toggleFeedback(index)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {expandedFeedback.has(index) ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        피드백 보기
                      </button>

                      {expandedFeedback.has(index) && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 text-sm">
                          {/* 교정 사항 */}
                          {message.feedback.corrections.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-red-600">교정</span>
                              <ul className="mt-0.5 space-y-0.5">
                                {message.feedback.corrections.map((c, ci) => (
                                  <li key={ci} className="text-red-600 text-xs flex items-start gap-1.5">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-red-400 shrink-0" />
                                    {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 제안 */}
                          {message.feedback.suggestions.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-blue-600">제안</span>
                              <ul className="mt-0.5 space-y-0.5">
                                {message.feedback.suggestions.map((s, si) => (
                                  <li key={si} className="text-blue-600 text-xs flex items-start gap-1.5">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-blue-400 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 격려 */}
                          {message.feedback.encouragement && (
                            <div>
                              <span className="text-xs font-semibold text-green-600">격려</span>
                              <p className="text-green-600 text-xs mt-0.5">
                                {message.feedback.encouragement}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-500 text-white rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="border-t bg-white p-4 shrink-0">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="영어로 대화를 입력하세요..."
                  disabled={isLoading || isStarting}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || isStarting}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* 시나리오 미선택 시 환영 화면 */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-violet-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">AI 영어 대화 연습</h2>
              <p className="text-slate-500 max-w-md">
                왼쪽에서 CEFR 레벨과 시나리오를 선택하여
                <br />
                AI와 영어 대화 연습을 시작해보세요.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                {CEFR_LEVELS.map((level) => (
                  <span
                    key={level}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[level]}`}
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

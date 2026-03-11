"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, BookOpen, Send } from "lucide-react"
import { askCurriculumAI } from "@/app/actions/ai-chat"

const SAMPLE_QUESTIONS = [
  "2022 개정 교육과정 고등학교 읽기 성취기준의 핵심 변화는?",
  "중학교 영어 교육과정에서 말하기 능력 향상을 위한 수업 전략은?",
  "한국 영어 교과서의 Lexile 지수가 수능 지문 대비 낮은 이유와 해결책은?",
  "CEFR B1 달성을 위해 필요한 수업 시수와 현실 격차 분석",
  "수능 영어 빈칸추론 문항의 출제 원리와 교수법적 함의는?",
]

export function CurriculumAITab() {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([])
  const [sessionId] = useState(() => `session_${Date.now()}`)

  const handleAsk = async (q?: string) => {
    const query = q ?? question
    if (!query.trim()) return

    setLoading(true)
    setAnswer("")
    if (!q) setQuestion("")

    const result = await askCurriculumAI(query, sessionId)

    if (result.success && result.answer) {
      setAnswer(result.answer)
      setHistory((prev) => [{ q: query, a: result.answer! }, ...prev.slice(0, 4)])
    } else {
      setAnswer("AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 왼쪽: 질문 패널 */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              AI에게 질문하기
            </CardTitle>
            <CardDescription className="text-xs">
              영어 교육과정, 수업 전략, 평가 방법에 대해 질문하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full h-28 p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="질문을 입력하세요..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAsk()
              }}
            />
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI 분석 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  질문하기 (Ctrl+Enter)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 샘플 질문 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">예시 질문</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SAMPLE_QUESTIONS.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAsk(q)}
                disabled={loading}
                className="w-full text-left text-xs p-2.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-600 hover:text-purple-700 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 오른쪽: 답변 패널 */}
      <div className="md:col-span-2 space-y-4">
        {/* 현재 답변 */}
        {(loading || answer) && (
          <Card className={loading ? "border-purple-200" : "border-purple-200 bg-purple-50/30"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI 분석 답변
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  교육과정 지식 DB를 검색하고 분석하는 중입니다...
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{answer}</p>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && !answer && history.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-16 text-center">
              <div className="space-y-2">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-slate-400 text-sm">왼쪽에서 질문하거나 예시 질문을 선택하세요</p>
                <p className="text-xs text-slate-300">
                  교육과정 분석 · 수업 전략 · 평가 설계 · 정책 해석
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 이전 대화 이력 */}
        {history.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium">이전 질문 이력</p>
            {history.map((item, i) => (
              <Card key={i} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <p className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Q. {item.q}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{item.a}</p>
                  <button
                    type="button"
                    className="text-xs text-purple-600 hover:underline"
                    onClick={() => {
                      setAnswer(item.a)
                      setQuestion(item.q)
                    }}
                  >
                    전체 보기
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

// 지문 → 유형 판정 화면 (M1). 지문을 붙여 넣으면 겉모양·목적·전개 방식 집합·학년 적합성·
// 성취기준 후보를 보여 준다. 유형으로 난이도를 말하지 않는다 — 난이도는 적합성 칸에서만.
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileText, AlertTriangle, CheckCircle2, HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import { analyzeTextType, type AnalyzeTextTypeResult } from "@/app/actions/text-type"

const GRADES = [
  { value: "middle1", label: "중1" }, { value: "middle2", label: "중2" }, { value: "middle3", label: "중3" },
  { value: "high1", label: "고1" }, { value: "high2", label: "고2" }, { value: "high3", label: "고3" },
]

const PURPOSE_KO: Record<string, string> = {
  narrative: "이야기·서사·운문", social: "친교·사회적", informative: "정보 전달·교환", argumentative: "의견·주장",
}
const FORM_KO: Record<string, string> = {
  letter: "편지·이메일", dialogue: "대화", notice: "안내·공지", advertisement: "광고", none: "",
}
const METHOD_KO: Record<string, string> = {
  narration: "서사", classification: "분류", cause_effect: "인과", definition: "정의", elaboration: "상세화",
  exemplification: "예시", comparison: "비교", contrast: "대조", problem_solution: "문제와 해결",
}
const VERDICT: Record<string, { label: string; cls: string }> = {
  ok: { label: "학년에 맞음", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  over: { label: "학년 상한 초과", cls: "bg-red-50 text-red-700 border-red-200" },
  under: { label: "학년 하한 미달", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  unknown: { label: "기준 없음", cls: "bg-slate-50 text-slate-500 border-slate-200" },
}

export function TextTypePanel() {
  const [grade, setGrade] = useState("middle2")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<AnalyzeTextTypeResult | null>(null)
  const [chosenPurpose, setChosenPurpose] = useState<string | null>(null)
  const [showRaters, setShowRaters] = useState(false)

  const words = text.match(/[A-Za-z][A-Za-z'-]*/g)?.length ?? 0

  async function run() {
    setBusy(true); setError(""); setResult(null); setChosenPurpose(null)
    try {
      const r = await analyzeTextType({ text, grade })
      if (r.ok) setResult(r)
      else setError(r.error)
    } catch {
      setError("판정 중 연결이 끊겼습니다. 다시 시도하세요.")
    } finally {
      setBusy(false)
    }
  }

  const a = result?.analysis
  const purpose = chosenPurpose ?? a?.type.purpose ?? null
  const ask = a?.type.confidence === "ask" && !chosenPurpose

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 왼쪽: 지문 입력 */}
      <Card>
        <CardHeader>
          <CardTitle>지문 넣기</CardTitle>
          <CardDescription>다음 시간에 쓸 지문을 붙여 넣으면 어떤 종류의 글인지 판정합니다. 지문 원문은 저장하지 않습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-sm font-medium mb-2 block">학년</Label>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button key={g.value} type="button" onClick={() => setGrade(g.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    grade === g.value ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-300 hover:border-teal-400"}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="passage" className="text-sm font-medium mb-1.5 block">
              지문 <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-slate-400 font-normal">{words} 낱말 · 40낱말 이상</span>
            </Label>
            <Textarea id="passage" rows={14} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="영어 지문을 여기에 붙여 넣으세요." className="font-mono text-sm leading-relaxed" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={run} disabled={busy || words < 40}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> 판정자 3명이 읽는 중… (30초쯤)</> : <><FileText className="h-4 w-4" /> 유형 판정하기</>}
          </Button>
          <p className="text-xs text-slate-400">
            판정자 3명(서로 다른 모델)이 각자 읽고, 겉모양은 규칙으로 잡습니다. 전개 방식은 셋이 모두 &ldquo;있다&rdquo;고 한 것만 남깁니다.
          </p>
        </CardContent>
      </Card>

      {/* 오른쪽: 결과 */}
      <div className="space-y-4">
        {busy && (
          <Card className="border-teal-200"><CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto" />
              <p className="text-slate-600">지문을 재고, 겉모양을 잡고, 판정자 셋에게 묻고 있습니다</p>
            </div>
          </CardContent></Card>
        )}

        {a && !busy && (
          <>
            {/* 종류 */}
            <Card className="border-teal-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-teal-700">이 글은</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {a.form.form !== "none" && (
                    <Badge className="bg-teal-600 text-white text-sm px-3 py-1">{FORM_KO[a.form.form]}</Badge>
                  )}
                  {purpose && !ask && (
                    <Badge variant="outline" className="text-sm px-3 py-1">{PURPOSE_KO[purpose]}
                      {a.type.formLed ? "" : ` · ${a.type.purposeVotes}/${a.type.raterCount} 일치`}
                    </Badge>
                  )}
                  {a.type.formLed && <span className="text-xs text-slate-400">겉모양이 활동을 정합니다</span>}
                </div>
                {a.form.signals.length > 0 && (
                  <p className="text-xs text-slate-500">잡힌 표지: {a.form.signals.slice(0, 4).join(" · ")}</p>
                )}
                {ask && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                    <p className="text-sm text-amber-800 flex items-center gap-1.5"><HelpCircle className="h-4 w-4" /> 판정자들이 갈렸습니다. 선생님이 정해 주세요.</p>
                    <div className="flex gap-2">
                      {[a.type.purpose, a.type.purposeRunnerUp].filter(Boolean).map((p, i) => (
                        <button key={p!} type="button" onClick={() => setChosenPurpose(p!)}
                          className="px-3 py-1.5 rounded-lg text-sm border bg-white border-amber-300 hover:bg-amber-100">
                          {["a", "b"][i]}. {PURPOSE_KO[p!]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {a.type.evidence.purpose && (
                  <p className="text-xs text-slate-500 border-l-2 border-slate-200 pl-2 italic">&ldquo;{a.type.evidence.purpose}&rdquo;</p>
                )}
              </CardContent>
            </Card>

            {/* 전개 방식 집합 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-teal-700">이 글에 쓰인 전개 방식</CardTitle>
                <CardDescription className="text-xs">판정자 셋이 모두 &ldquo;있다&rdquo;고 한 것. 활동은 여기에 겁니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {a.type.methodsPresent.length === 0 ? (
                  <p className="text-sm text-slate-500">셋이 함께 잡은 전개 방식이 없습니다. 편지·안내문처럼 전개가 얇은 글이면 자연스럽습니다 — 활동은 글의 종류에 겁니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {a.type.methodsPresent.map((m) => {
                      const dim = a.type.alwaysOn.includes(m)
                      return (
                        <Badge key={m} variant="outline" title={dim ? "거의 모든 글에 있어 활동을 가르지 못합니다" : undefined}
                          className={dim ? "text-slate-400 border-dashed" : "bg-teal-50 text-teal-800 border-teal-200"}>
                          {METHOD_KO[m]}
                        </Badge>
                      )
                    })}
                  </div>
                )}
                {a.type.methodsPresent.filter((m) => !a.type.alwaysOn.includes(m)).map((m) => a.type.evidence[m] && (
                  <p key={m} className="text-xs text-slate-500 border-l-2 border-teal-200 pl-2">
                    <span className="font-medium text-teal-700">{METHOD_KO[m]}</span> — &ldquo;{a.type.evidence[m]}&rdquo;
                  </p>
                ))}
              </CardContent>
            </Card>

            {/* 학년 적합성 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  학년 적합성
                  <Badge variant="outline" className={VERDICT[a.fit.verdict].cls}>
                    {a.fit.verdict === "ok" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                    {VERDICT[a.fit.verdict].label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-1">
                <p className="text-xs text-slate-400">
                  {a.measures.words}낱말 · {a.measures.sentences}문장 · 문장당 {a.measures.wordsPerSentence}낱말 · FK {a.measures.fleschKincaid}
                  {a.fit.approximated && " · 고1 기준으로 봄"}
                </p>
                {a.fit.reasons.map((r) => <p key={r}>· {r}</p>)}
              </CardContent>
            </Card>

            {/* 성취기준 후보 */}
            {result.standards.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-600">성취기준 후보</CardTitle>
                  <CardDescription className="text-xs">검증된 원문만. 전개 방식·구조를 다루는 것을 앞에 두었습니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {result.standards.slice(0, 8).map((s) => (
                    <p key={s.id} className="text-xs text-slate-600"><span className="font-mono text-teal-700">{s.id}</span> {s.text}</p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 판정자 원자료 */}
            <button type="button" onClick={() => setShowRaters(!showRaters)}
              className="text-xs text-slate-400 flex items-center gap-1 hover:text-slate-600">
              {showRaters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} 판정자별 답 보기
            </button>
            {showRaters && (
              <Card className="bg-slate-50"><CardContent className="pt-4 space-y-2">
                {a.raters.map((r) => (
                  <p key={r.rater} className="text-xs text-slate-600">
                    <span className="font-mono">{r.rater}</span> · 목적 {r.purpose ? PURPOSE_KO[r.purpose] : "—"} · 있다:{" "}
                    {Object.entries(r.methods).filter(([, v]) => v?.present).map(([k]) => METHOD_KO[k]).join(", ") || "—"}
                  </p>
                ))}
              </CardContent></Card>
            )}
          </>
        )}

        {!busy && !a && (
          <Card className="border-dashed"><CardContent className="flex items-center justify-center py-16 text-center">
            <div className="space-y-3">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-slate-400 text-sm">왼쪽에 지문을 붙여 넣고 판정하기를 누르세요</p>
              <p className="text-xs text-slate-300">겉모양 · 목적 · 전개 방식 집합 · 학년 적합성 · 성취기준 후보</p>
            </div>
          </CardContent></Card>
        )}
      </div>
    </div>
  )
}

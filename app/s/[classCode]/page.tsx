"use client"

import { useState, useEffect, useCallback, use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ClipboardCheck,
} from "lucide-react"
import {
  peekClass,
  resolveStudentByPick,
  resolveStudentByToken,
  type ClassPeek,
} from "@/app/actions/student-auth"
import {
  startVocabCat,
  answerVocabCat,
  type CatStep,
} from "@/app/actions/diagnosis"
import {
  getStudentAssignments,
  openAssignment,
  recordAttempt,
  completeAssignment,
  type StudentAssignment,
  type AssignmentView,
} from "@/app/actions/assignments"
import {
  getStudentSession,
  setStudentSession,
  clearStudentSession,
} from "@/lib/student-identity"

type Phase = "loading" | "notfound" | "identify" | "menu" | "cat" | "assignment"

export default function StudentEntry({
  params,
}: {
  params: Promise<{ classCode: string }>
}) {
  const { classCode } = use(params)

  const [phase, setPhase] = useState<Phase>("loading")
  const [cls, setCls] = useState<ClassPeek | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [studentName, setStudentName] = useState<string>("")
  const [activeAssignment, setActiveAssignment] = useState<string | null>(null)

  const loadClass = useCallback(async () => {
    const peek = await peekClass(classCode)
    if (!peek.found) {
      setPhase("notfound")
      return
    }
    setCls(peek)
    // 이 기기에서 지난번 신원이 기억돼 있으면 바로 메뉴로
    const remembered = getStudentSession(classCode)
    if (remembered && peek.students?.some((s) => s.id === remembered.studentId)) {
      setStudentId(remembered.studentId)
      setStudentName(remembered.studentName)
      setPhase("menu")
    } else {
      setPhase("identify")
    }
  }, [classCode])

  useEffect(() => {
    loadClass()
  }, [loadClass])

  function onResolved(id: string, name: string) {
    setStudentId(id)
    setStudentName(name)
    setStudentSession({ classCode, studentId: id, studentName: name })
    setPhase("menu")
  }

  function switchStudent() {
    clearStudentSession(classCode)
    setStudentId(null)
    setStudentName("")
    setPhase("identify")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="mx-auto max-w-md px-4 py-8">
        <header className="mb-6 text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-sky-700">
            <GraduationCap className="h-6 w-6" />
            <span className="font-bold">영어 진단</span>
          </div>
          {cls?.className && (
            <p className="text-sm text-slate-500">
              {cls.className} · 반 코드 {classCode.toUpperCase()}
            </p>
          )}
        </header>

        {phase === "loading" && (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {phase === "notfound" && (
          <Card>
            <CardContent className="py-10 text-center text-slate-600">
              <p className="mb-1 font-semibold">반을 찾을 수 없어요</p>
              <p className="text-sm text-slate-400">
                반 코드를 다시 확인하세요. (선생님이 알려준 6자)
              </p>
            </CardContent>
          </Card>
        )}

        {phase === "identify" && cls && (
          <IdentifyStep classCode={classCode} cls={cls} onResolved={onResolved} />
        )}

        {phase === "menu" && studentId && cls && (
          <MenuStep
            studentName={studentName}
            studentId={studentId}
            gradeBand={cls.gradeBand ?? ""}
            gradeLabel={cls.gradeLabel ?? ""}
            classCode={classCode}
            onStartCat={() => setPhase("cat")}
            onOpenAssignment={(id) => {
              setActiveAssignment(id)
              setPhase("assignment")
            }}
            onSwitch={switchStudent}
          />
        )}

        {phase === "cat" && studentId && cls && (
          <CatRunner
            studentId={studentId}
            gradeBand={cls.gradeBand ?? ""}
            gradeLabel={cls.gradeLabel ?? ""}
            onDone={() => setPhase("menu")}
          />
        )}

        {phase === "assignment" && studentId && activeAssignment && (
          <AssignmentRunner
            assignmentId={activeAssignment}
            studentId={studentId}
            onDone={() => setPhase("menu")}
          />
        )}
      </div>
    </div>
  )
}

// ── 신원 확정 ──────────────────────────────────────────────
function IdentifyStep({
  classCode,
  cls,
  onResolved,
}: {
  classCode: string
  cls: ClassPeek
  onResolved: (id: string, name: string) => void
}) {
  const [mode, setMode] = useState<"pick" | "token">("pick")
  const [token, setToken] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")

  async function pick(id: string) {
    setBusy(true)
    setErr("")
    const r = await resolveStudentByPick({ classCode, studentId: id })
    setBusy(false)
    if (r.ok && r.studentId) onResolved(r.studentId, r.studentName ?? "")
    else setErr(r.error ?? "확인 실패")
  }

  async function byToken() {
    setBusy(true)
    setErr("")
    const r = await resolveStudentByToken({ classCode, joinToken: token })
    setBusy(false)
    if (r.ok && r.studentId) onResolved(r.studentId, r.studentName ?? "")
    else setErr(r.error ?? "확인 실패")
  }

  return (
    <Card>
      <CardContent className="py-6">
        <p className="mb-4 text-center font-semibold text-slate-700">누구인가요?</p>

        <div className="mb-4 flex gap-2">
          <Button
            variant={mode === "pick" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("pick")}
          >
            이름 찾기
          </Button>
          <Button
            variant={mode === "token" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("token")}
          >
            내 토큰 입력
          </Button>
        </div>

        {mode === "pick" ? (
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto">
            {cls.students?.map((s) => (
              <Button
                key={s.id}
                variant="outline"
                disabled={busy}
                className="h-auto justify-start py-3"
                onClick={() => pick(s.id)}
              >
                <span className="truncate">
                  {s.seatNo != null && (
                    <span className="mr-1 text-xs text-slate-400">{s.seatNo}</span>
                  )}
                  {s.name}
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="카드의 6자 토큰"
              value={token}
              maxLength={8}
              className="text-center font-mono text-lg tracking-widest"
              onChange={(e) => setToken(e.target.value)}
            />
            <Button className="w-full" disabled={busy || !token} onClick={byToken}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              확인
            </Button>
          </div>
        )}

        {err && <p className="mt-3 text-center text-sm text-red-500">{err}</p>}
      </CardContent>
    </Card>
  )
}

// ── 진단 선택 ──────────────────────────────────────────────
function MenuStep({
  studentName,
  studentId,
  classCode,
  onStartCat,
  onOpenAssignment,
  onSwitch,
}: {
  studentName: string
  studentId: string
  gradeBand: string
  gradeLabel: string
  classCode: string
  onStartCat: () => void
  onOpenAssignment: (id: string) => void
  onSwitch: () => void
}) {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([])

  useEffect(() => {
    getStudentAssignments(studentId).then(setAssignments)
  }, [studentId])

  const open = assignments.filter((a) => a.status !== "completed")

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs text-slate-400">안녕하세요</p>
            <p className="text-lg font-bold text-slate-800">{studentName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onSwitch}>
            내가 아니에요
          </Button>
        </CardContent>
      </Card>

      {/* 내 과제 */}
      {open.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-sm font-semibold text-slate-600">
            내 과제 ({open.length})
          </p>
          {open.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer border-amber-200 transition hover:border-amber-400 hover:shadow-md"
              onClick={() => onOpenAssignment(a.id)}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <ClipboardCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.kind === "worksheet" ? `문항 ${a.itemCount}개` : "단어장"}
                    {a.status === "started" && " · 진행 중"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="cursor-pointer transition hover:border-sky-400 hover:shadow-md" onClick={onStartCat}>
        <CardContent className="flex items-center gap-3 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100">
            <Sparkles className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">어휘 진단</p>
            <p className="text-sm text-slate-500">적응형 단어 테스트 (약 20문항, 5분)</p>
          </div>
        </CardContent>
      </Card>

      <a href={`/lexile-test?student=${encodeURIComponent(studentId)}&class=${classCode}`}>
        <Card className="cursor-pointer transition hover:border-emerald-400 hover:shadow-md">
          <CardContent className="flex items-center gap-3 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">읽기 수준 진단</p>
              <p className="text-sm text-slate-500">Lexile 지문 테스트</p>
            </div>
          </CardContent>
        </Card>
      </a>
    </div>
  )
}

// ── 어휘 CAT 러너 ─────────────────────────────────────────
function CatRunner({
  studentId,
  gradeBand,
  gradeLabel,
  onDone,
}: {
  studentId: string
  gradeBand: string
  gradeLabel: string
  onDone: () => void
}) {
  const [step, setStep] = useState<CatStep | null>(null)
  const [busy, setBusy] = useState(true)
  const [err, setErr] = useState("")
  const [tStart, setTStart] = useState(0)

  const begin = useCallback(async () => {
    setBusy(true)
    setErr("")
    const r = await startVocabCat({ studentId, gradeBand, gradeLabel })
    setBusy(false)
    if (r.ok && r.step) {
      setStep(r.step)
      setTStart(performance.now())
    } else {
      setErr(r.error ?? "시작 실패")
    }
  }, [studentId, gradeBand, gradeLabel])

  useEffect(() => {
    begin()
  }, [begin])

  async function choose(option: string, isDontKnow = false) {
    if (!step?.item || busy) return
    setBusy(true)
    const rt = Math.max(0, Math.round(performance.now() - tStart))
    const r = await answerVocabCat({
      sessionId: step.sessionId,
      chosenOption: option,
      responseTimeMs: rt,
      isDontKnow,
    })
    setBusy(false)
    if (r.ok && r.step) {
      setStep(r.step)
      setTStart(performance.now())
    } else {
      setErr(r.error ?? "응답 실패")
    }
  }

  if (busy && !step) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">진단 서버 준비 중…</span>
      </div>
    )
  }

  if (err) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="mb-3 text-red-500">{err}</p>
          <Button onClick={begin} variant="outline">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step?.complete && step.result) {
    const r = step.result
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <p className="mb-1 text-lg font-bold text-slate-800">진단 완료!</p>
          <p className="mb-4 text-sm text-slate-500">
            {step.itemsDone}문항 · 정확도 {Math.round((r.accuracy ?? 0) * 100)}%
          </p>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-sky-50 py-3">
              <p className="text-xs text-slate-400">CEFR</p>
              <p className="text-xl font-bold text-sky-700">{r.cefr}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 py-3">
              <p className="text-xs text-slate-400">추정 어휘량</p>
              <p className="text-xl font-bold text-emerald-700">
                {r.vocabSize?.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-500">{r.curriculumLevel}</p>
          <Button onClick={onDone} className="w-full">
            선생님께 제출 완료 · 돌아가기
          </Button>
        </CardContent>
      </Card>
    )
  }

  const item = step?.item
  if (!item) return null

  return (
    <div>
      <div className="mb-4">
        <Progress value={Math.min(100, (step!.itemsDone / 22) * 100)} className="h-2" />
        <p className="mt-1 text-right text-xs text-slate-400">{step!.itemsDone}문항</p>
      </div>

      <Card className="mb-4">
        <CardContent className="py-8 text-center">
          <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
            {item.pos} · {item.cefr}
          </p>
          <p className="text-3xl font-bold text-slate-800">{item.word}</p>
          {item.stem && <p className="mt-2 text-sm text-slate-500">{item.stem}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-2">
        {item.options.map((opt) => (
          <Button
            key={opt}
            variant="outline"
            disabled={busy}
            className="h-auto justify-start whitespace-normal py-4 text-left"
            onClick={() => choose(opt)}
          >
            {opt}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          className="mt-1 text-slate-400"
          onClick={() => choose("", true)}
        >
          모르겠어요
        </Button>
      </div>
    </div>
  )
}

// ── 과제 러너 ─────────────────────────────────────────────
function AssignmentRunner({
  assignmentId,
  studentId,
  onDone,
}: {
  assignmentId: string
  studentId: string
  onDone: () => void
}) {
  const [view, setView] = useState<AssignmentView | null>(null)
  const [idx, setIdx] = useState(0)
  const [busy, setBusy] = useState(true)
  const [err, setErr] = useState("")
  const [answered, setAnswered] = useState<Record<number, { chosen: number; correct: boolean | null }>>({})
  const [textResp, setTextResp] = useState("")
  const [tStart, setTStart] = useState(0)
  const [finalScore, setFinalScore] = useState<number | null | undefined>(undefined)

  const load = useCallback(async () => {
    setBusy(true)
    const r = await openAssignment({ assignmentId, studentId })
    setBusy(false)
    if (r.ok && r.view) {
      setView(r.view)
      setTStart(performance.now())
    } else setErr(r.error ?? "열기 실패")
  }, [assignmentId, studentId])

  useEffect(() => {
    load()
  }, [load])

  const items = view?.items ?? []
  const item = items[idx]

  async function submitMcq(chosenIndex: number) {
    if (busy) return
    setBusy(true)
    const rt = Math.max(0, Math.round(performance.now() - tStart))
    const r = await recordAttempt({ assignmentId, studentId, itemIndex: idx, chosenIndex, timeMs: rt })
    setBusy(false)
    if (r.ok) setAnswered((p) => ({ ...p, [idx]: { chosen: chosenIndex, correct: r.correct ?? null } }))
  }

  async function submitShort() {
    if (busy) return
    setBusy(true)
    await recordAttempt({ assignmentId, studentId, itemIndex: idx, textResponse: textResp })
    setBusy(false)
    setAnswered((p) => ({ ...p, [idx]: { chosen: -1, correct: null } }))
  }

  function next() {
    setTextResp("")
    setTStart(performance.now())
    if (idx < items.length - 1) setIdx(idx + 1)
    else finish()
  }

  async function finish() {
    setBusy(true)
    const r = await completeAssignment({ assignmentId, studentId })
    setBusy(false)
    setFinalScore(r.ok ? r.score ?? null : null)
  }

  if (busy && !view) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  if (err) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="mb-3 text-red-500">{err}</p>
          <Button variant="outline" onClick={onDone}>돌아가기</Button>
        </CardContent>
      </Card>
    )
  }

  // 완료 화면
  if (finalScore !== undefined) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <p className="mb-1 text-lg font-bold text-slate-800">제출 완료!</p>
          {finalScore != null && (
            <p className="mb-4 text-sm text-slate-500">
              점수 {Math.round(finalScore * 100)}점
            </p>
          )}
          <Button className="w-full" onClick={onDone}>돌아가기</Button>
        </CardContent>
      </Card>
    )
  }

  // 단어장(문항 없음): 학습 후 완료 표시
  if (view && items.length === 0) {
    return (
      <div>
        <Card className="mb-4">
          <CardContent className="py-5">
            <p className="mb-3 font-semibold text-slate-800">{view.title}</p>
            {view.words && Array.isArray(view.words) && (
              <div className="grid grid-cols-2 gap-1 text-sm">
                {view.words.map((w: string, i: number) => (
                  <span key={i} className="rounded bg-slate-50 px-2 py-1">{w}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Button className="w-full" onClick={finish} disabled={busy}>
          다 외웠어요 · 완료
        </Button>
      </div>
    )
  }

  const done = answered[idx] !== undefined

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{view?.title}</span>
        <span className="text-slate-400">{idx + 1}/{items.length}</span>
      </div>

      {view?.passageBody && idx === 0 && (
        <Card className="mb-4">
          <CardContent className="py-4">
            {view.passageTopic && <p className="mb-1 font-semibold text-slate-700">{view.passageTopic}</p>}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {view.passageBody}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardContent className="py-5">
          <p className="mb-3 font-medium text-slate-800">{idx + 1}. {item?.question}</p>

          {item?.type === "mcq" && item.options ? (
            <div className="grid gap-2">
              {item.options.map((opt, j) => {
                const picked = answered[idx]?.chosen === j
                return (
                  <Button
                    key={j}
                    variant={picked ? "default" : "outline"}
                    disabled={busy || done}
                    className="h-auto justify-start whitespace-normal py-3 text-left"
                    onClick={() => submitMcq(j)}
                  >
                    {opt}
                  </Button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="답을 입력하세요"
                value={textResp}
                disabled={done}
                onChange={(e) => setTextResp(e.target.value)}
              />
              {!done && (
                <Button size="sm" onClick={submitShort} disabled={busy || !textResp}>
                  제출
                </Button>
              )}
            </div>
          )}

          {done && answered[idx]?.correct != null && (
            <p className={`mt-3 text-sm ${answered[idx].correct ? "text-emerald-600" : "text-red-500"}`}>
              {answered[idx].correct ? "정답!" : "다시 볼까요"}
            </p>
          )}
        </CardContent>
      </Card>

      {done && (
        <Button className="w-full" onClick={next} disabled={busy}>
          {idx < items.length - 1 ? "다음" : "제출하기"}
        </Button>
      )}
    </div>
  )
}

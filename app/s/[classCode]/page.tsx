"use client"

import { useState, useEffect, useCallback, use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Loader2, BookOpen, CheckCircle2, GraduationCap, Sparkles } from "lucide-react"
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
  getStudentSession,
  setStudentSession,
  clearStudentSession,
} from "@/lib/student-identity"

type Phase = "loading" | "notfound" | "identify" | "menu" | "cat"

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
  onSwitch,
}: {
  studentName: string
  studentId: string
  gradeBand: string
  gradeLabel: string
  classCode: string
  onStartCat: () => void
  onSwitch: () => void
}) {
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

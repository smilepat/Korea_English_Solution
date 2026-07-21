"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  BookOpen,
  ListChecks,
  Printer,
  Loader2,
  Search,
  Sparkles,
  Check,
} from "lucide-react"
import { getClasses } from "@/app/actions/students"
import {
  queryWordlist,
  listPassages,
  deriveClassLexileWindow,
  generatePassageWorksheet,
  saveWorksheet,
  type WordlistItem,
  type PassageRow,
  type WorksheetItem,
} from "@/app/actions/content"
import { createAssignment } from "@/app/actions/assignments"
import { curriculumSearch, type StdResult } from "@/app/actions/curriculum-search"

// 저장 후 반에 배정하는 공용 바.
function AssignBar({
  worksheetId,
  classes,
  defaultClassId,
}: {
  worksheetId: string
  classes: Array<{ id: string; name: string }>
  defaultClassId?: string
}) {
  const [classId, setClassId] = useState(defaultClassId ?? "")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  async function assign() {
    if (!classId) return
    setBusy(true)
    setMsg("")
    const r = await createAssignment({ classId, worksheetId })
    setBusy(false)
    setMsg(r.ok ? "반 전체에 배정됨 ✓" : r.error ?? "배정 실패")
  }

  return (
    <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 px-2 py-2">
      <Select value={classId} onValueChange={setClassId}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="반 선택" />
        </SelectTrigger>
        <SelectContent>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" className="h-8 shrink-0" disabled={!classId || busy} onClick={assign}>
        배정
      </Button>
      {msg && <span className="shrink-0 text-xs text-amber-700">{msg}</span>}
    </div>
  )
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
const GRADE_BANDS = [
  { value: "", label: "전체" },
  { value: "elementary", label: "초등" },
  { value: "middle", label: "중등" },
  { value: "high", label: "고등" },
]

export default function WorksheetStudio() {
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #print-area { margin: 0 !important; }
        }
        @page { margin: 15mm; }
      `}</style>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="no-print mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> 홈
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">워크시트 · 단어장 스튜디오</h1>
            <p className="text-sm text-slate-500">
              교육과정 어휘·창작 지문에서 학생 수준에 맞춰 인쇄물을 만듭니다.
            </p>
          </div>
        </div>

        <Tabs defaultValue="wordlist" className="no-print">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="wordlist">
              <ListChecks className="mr-1 h-4 w-4" /> 단어장
            </TabsTrigger>
            <TabsTrigger value="worksheet">
              <BookOpen className="mr-1 h-4 w-4" /> 워크시트
            </TabsTrigger>
          </TabsList>
          <TabsContent value="wordlist">
            <WordlistBuilder />
          </TabsContent>
          <TabsContent value="worksheet">
            <WorksheetBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ══ 단어장 빌더 ════════════════════════════════════════════
function WordlistBuilder() {
  const [cefr, setCefr] = useState<string[]>(["A2", "B1"])
  const [curriculumOnly, setCurriculumOnly] = useState(false)
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<WordlistItem[]>([])
  const [selected, setSelected] = useState<Record<string, WordlistItem>>({})
  const [loading, setLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [savedId, setSavedId] = useState("")
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    getClasses().then((cs) => setClasses(cs.map((c) => ({ id: c.id, name: c.name }))))
  }, [])

  const run = useCallback(async () => {
    setLoading(true)
    const r = await queryWordlist({ cefr, curriculumOnly, search, limit: 300 })
    setRows(r)
    setLoading(false)
  }, [cefr, curriculumOnly, search])

  useEffect(() => {
    run()
  }, []) // 최초 1회

  function toggleCefr(c: string) {
    setCefr((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }
  function toggleWord(w: WordlistItem) {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[w.wordId]) delete next[w.wordId]
      else next[w.wordId] = w
      return next
    })
  }

  const chosen = Object.values(selected)

  async function save() {
    if (chosen.length === 0) return
    setSaveMsg("")
    const res = await saveWorksheet({
      title: `단어장 ${new Date().toISOString().slice(0, 10)} (${chosen.length}단어)`,
      kind: "wordlist",
      spec: { words: chosen.map((w) => w.word), items: chosen },
      provenance: [
        { source: "vocab-graph-db@efl-data-hub", license: "original" },
        { source: "vocab-context", license: "original" },
      ],
    })
    setSaveMsg(res.ok ? "저장됨 ✓" : res.error ?? "저장 실패")
    if (res.ok && res.id) setSavedId(res.id)
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      {/* 필터 + 결과 */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">어휘 검색</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {CEFR_LEVELS.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={cefr.includes(c) ? "default" : "outline"}
                  onClick={() => toggleCefr(c)}
                >
                  {c}
                </Button>
              ))}
              <Button
                size="sm"
                variant={curriculumOnly ? "default" : "outline"}
                onClick={() => setCurriculumOnly((v) => !v)}
              >
                교육과정만
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="단어 또는 뜻 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
              />
              <Button onClick={run} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <div className="max-h-[28rem] divide-y overflow-y-auto rounded-md border">
              {rows.map((w) => {
                const on = Boolean(selected[w.wordId])
                return (
                  <button
                    key={w.wordId}
                    onClick={() => toggleWord(w)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 ${
                      on ? "bg-teal-50" : ""
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        on ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300"
                      }`}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="w-32 shrink-0 font-medium text-slate-800">{w.word}</span>
                    <span className="flex-1 truncate text-sm text-slate-500">{w.meaningKo}</span>
                    {w.cefr && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {w.cefr}
                      </Badge>
                    )}
                    {w.inCurriculum && (
                      <Badge className="shrink-0 bg-emerald-100 text-xs text-emerald-700 hover:bg-emerald-100">
                        교육과정
                      </Badge>
                    )}
                  </button>
                )
              })}
              {rows.length === 0 && !loading && (
                <p className="px-3 py-8 text-center text-sm text-slate-400">
                  조건에 맞는 단어가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 선택 목록 + 인쇄 */}
      <div>
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>선택 {chosen.length}단어</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={!chosen.length} onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button size="sm" disabled={!chosen.length} onClick={save}>
                  저장
                </Button>
              </div>
            </CardTitle>
            {saveMsg && <p className="text-xs text-teal-600">{saveMsg}</p>}
            {savedId && <AssignBar worksheetId={savedId} classes={classes} />}
          </CardHeader>
          <CardContent>
            {chosen.length === 0 ? (
              <p className="text-sm text-slate-400">왼쪽에서 단어를 선택하세요.</p>
            ) : (
              <div id="print-area" className="space-y-1.5 text-sm">
                <h2 className="mb-2 hidden text-lg font-bold print:block">단어장</h2>
                {chosen.map((w) => (
                  <div key={w.wordId} className="border-b py-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{w.word}</span>
                      <span className="text-slate-400">{w.pos}</span>
                    </div>
                    <div className="text-slate-600">{w.meaningKo}</div>
                    {w.exEn && <div className="text-xs italic text-slate-400">{w.exEn}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ══ 워크시트(지문) 빌더 ════════════════════════════════════
function WorksheetBuilder() {
  const [classes, setClasses] = useState<Array<{ id: string; name: string; gradeBand: string }>>([])
  const [classId, setClassId] = useState("")
  const [gradeBand, setGradeBand] = useState("")
  const [lexWindow, setLexWindow] = useState<{ min: number; max: number; center: number; n: number } | null>(null)
  const [passages, setPassages] = useState<PassageRow[]>([])
  const [selected, setSelected] = useState<PassageRow | null>(null)
  const [items, setItems] = useState<WorksheetItem[]>([])
  const [loading, setLoading] = useState(false)
  const [gen, setGen] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [savedId, setSavedId] = useState("")
  // 성취기준 정렬 (P-A: 교육과정 기반 문항의 중심축)
  const [stdQuery, setStdQuery] = useState("")
  const [stdResults, setStdResults] = useState<StdResult[]>([])
  const [stdSelected, setStdSelected] = useState<Record<string, StdResult>>({})
  const [stdLoading, setStdLoading] = useState(false)

  useEffect(() => {
    getClasses().then((cs) => setClasses(cs.map((c) => ({ id: c.id, name: c.name, gradeBand: c.gradeBand }))))
  }, [])

  const searchStandards = useCallback(
    async (gb?: string) => {
      setStdLoading(true)
      const band = (gb || gradeBand || undefined) as
        | "elementary"
        | "middle"
        | "high"
        | undefined
      // 2022 개정 우선, 학교급 필터. 빈 검색어면 학교급 성취기준 목록.
      const resp = await curriculumSearch(stdQuery, "structured", { band, version: "2022" }, 25)
      setStdResults(resp.results)
      setStdLoading(false)
    },
    [stdQuery, gradeBand],
  )

  function toggleStandard(s: StdResult) {
    setStdSelected((prev) => {
      const next = { ...prev }
      if (next[s.standard_id]) delete next[s.standard_id]
      else next[s.standard_id] = s
      return next
    })
  }
  const chosenStandards = Object.values(stdSelected)

  async function applyClass(id: string) {
    setClassId(id)
    if (!id) {
      setLexWindow(null)
      return
    }
    const w = await deriveClassLexileWindow(id)
    setLexWindow(w)
    const cls = classes.find((c) => c.id === id)
    if (cls) setGradeBand(cls.gradeBand)
    await loadPassages(w ?? undefined, cls?.gradeBand)
    // 학교급에 맞는 성취기준 목록을 미리 띄운다
    if (cls?.gradeBand) await searchStandards(cls.gradeBand)
  }

  const loadPassages = useCallback(
    async (w?: { min: number; max: number }, gb?: string) => {
      setLoading(true)
      const r = await listPassages({
        lexileMin: w?.min,
        lexileMax: w?.max,
        gradeBand: gb || gradeBand || undefined,
        limit: 60,
      })
      setPassages(r)
      setLoading(false)
    },
    [gradeBand],
  )

  useEffect(() => {
    loadPassages()
  }, []) // 최초

  async function generate() {
    if (!selected) return
    setGen(true)
    setItems([])
    // 선택한 성취기준에 정렬된 문항 생성(P-A)
    const r = await generatePassageWorksheet({
      textId: selected.textId,
      standardIds: chosenStandards.map((s) => s.standard_id),
      numItems: 4,
    })
    setGen(false)
    if (r.ok && r.items) setItems(r.items)
  }

  async function save() {
    if (!selected) return
    setSaveMsg("")
    const stdIds = chosenStandards.map((s) => s.standard_id)
    const r = await saveWorksheet({
      classId: classId || undefined,
      title: `워크시트 ${selected.topic ?? selected.textId}`,
      kind: "worksheet",
      gradeBand: gradeBand || undefined,
      targetLexileMin: lexWindow?.min,
      targetLexileMax: lexWindow?.max,
      spec: { passageId: selected.textId, items },
      standardIds: stdIds.length ? stdIds : undefined,
      provenance: [
        { source: selected.license === "original" ? "lexile_textdb_original" : selected.license, license: selected.license },
        ...(items.length ? [{ source: "gemini", license: "generated" }] : []),
      ],
    })
    setSaveMsg(r.ok ? "저장됨 ✓" : r.error ?? "저장 실패")
    if (r.ok && r.id) setSavedId(r.id)
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      {/* 좌: 타겟팅 + 지문 목록 */}
      <div className="lg:col-span-1 space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">수준 타겟팅</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">반 (진단값으로 자동 타겟)</label>
              <Select value={classId} onValueChange={applyClass}>
                <SelectTrigger>
                  <SelectValue placeholder="반 선택(선택)" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {lexWindow && (
              <div className="rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-700">
                타겟 Lexile <b>{lexWindow.min}–{lexWindow.max}</b>L
                <span className="ml-1 text-xs text-sky-500">
                  (중앙 {lexWindow.center}L · {lexWindow.n}명)
                </span>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs text-slate-500">학교급</label>
              <Select
                value={gradeBand || "all"}
                onValueChange={(v) => {
                  const gb = v === "all" ? "" : v
                  setGradeBand(gb)
                  loadPassages(lexWindow ?? undefined, gb)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_BANDS.map((b) => (
                    <SelectItem key={b.value || "all"} value={b.value || "all"}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 성취기준 정렬 (P-A) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              성취기준 정렬
              {chosenStandards.length > 0 && (
                <span className="ml-1 text-xs text-teal-600">{chosenStandards.length} 선택</span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              2022 개정 성취기준을 골라 문항을 정렬합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-1">
              <Input
                className="h-8 text-xs"
                placeholder="성취기준 검색 (예: 요지, [9영])"
                value={stdQuery}
                onChange={(e) => setStdQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchStandards()}
              />
              <Button size="sm" className="h-8 shrink-0" onClick={() => searchStandards()} disabled={stdLoading}>
                {stdLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {chosenStandards.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {chosenStandards.map((s) => (
                  <Badge
                    key={s.standard_id}
                    className="cursor-pointer bg-teal-100 text-xs text-teal-700 hover:bg-teal-200"
                    onClick={() => toggleStandard(s)}
                  >
                    {s.standard_id} ✕
                  </Badge>
                ))}
              </div>
            )}
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {stdResults.map((s) => {
                const on = Boolean(stdSelected[s.standard_id])
                return (
                  <button
                    key={s.standard_id}
                    onClick={() => toggleStandard(s)}
                    className={`w-full rounded border px-2 py-1.5 text-left text-xs hover:border-teal-400 ${
                      on ? "border-teal-500 bg-teal-50" : ""
                    }`}
                  >
                    <span className="font-mono text-teal-700">{s.standard_id}</span>
                    <span className="ml-1 text-slate-400">{s.domain_name_ko}</span>
                    <p className="mt-0.5 line-clamp-2 text-slate-600">{s.standard_text_ko}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              지문 {loading ? "" : `(${passages.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[24rem] space-y-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-6 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                passages.map((p) => (
                  <button
                    key={p.textId}
                    onClick={() => { setSelected(p); setItems([]) }}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm hover:border-sky-400 ${
                      selected?.textId === p.textId ? "border-sky-500 bg-sky-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium text-slate-700">{p.topic}</span>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {p.lexileScore}L
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.genre} · {p.wordCount}단어 · {p.gradeHint}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 우: 미리보기 + 생성 + 인쇄 */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>미리보기</span>
              {selected && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={generate} disabled={gen}>
                    {gen ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                    문항 생성
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={save}>저장</Button>
                </div>
              )}
            </CardTitle>
            {saveMsg && <p className="text-xs text-teal-600">{saveMsg}</p>}
            {savedId && (
              <AssignBar worksheetId={savedId} classes={classes} defaultClassId={classId} />
            )}
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="py-10 text-center text-sm text-slate-400">
                왼쪽에서 지문을 선택하세요. 반을 고르면 학생 진단 수준에 맞춰 지문이 걸러집니다.
              </p>
            ) : (
              <div id="print-area" className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{selected.topic}</h2>
                  <p className="text-xs text-slate-400">
                    Lexile {selected.lexileScore}L · {selected.genre} · {selected.wordCount}단어
                  </p>
                  {chosenStandards.length > 0 && (
                    <p className="mt-1 text-xs text-teal-600">
                      성취기준: {chosenStandards.map((s) => s.standard_id).join(", ")}
                    </p>
                  )}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-800">
                  {selected.textBody}
                </p>
                {items.length > 0 && (
                  <div className="space-y-3 border-t pt-3">
                    <h3 className="font-semibold text-slate-700">문항</h3>
                    {items.map((it, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">
                          {i + 1}. {it.question}
                        </p>
                        {it.options && (
                          <ol className="ml-4 mt-1 list-decimal text-slate-600">
                            {it.options.map((o, j) => (
                              <li key={j}>{o}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-slate-300 print:hidden">
                      * 문항은 AI 생성입니다. 검토 후 사용하세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

// 인쇄 화면 — 학생 활동지 / 교사 지도안. 데이터는 sessionStorage 에서 온다 (서버 저장 없음).
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LessonBuildView, STORAGE_KEY } from "@/components/lesson-build-view"
import type { BuiltLesson } from "@/app/actions/lesson-build"

const GRADE_KO: Record<string, string> = {
  middle1: "중1", middle2: "중2", middle3: "중3", high1: "고1", high2: "고2", high3: "고3",
}

function PrintInner() {
  const params = useSearchParams()
  const view = params.get("view") === "student" ? "student" : "teacher"
  const [built, setBuilt] = useState<BuiltLesson | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setBuilt(JSON.parse(raw) as BuiltLesson)
      else setMissing(true)
    } catch { setMissing(true) }
  }, [])

  if (missing) return <p className="p-8 text-slate-500 text-sm">인쇄할 활동이 없습니다. 수업 설계 화면에서 &lsquo;활동 만들기&rsquo;를 먼저 하세요.</p>
  if (!built) return null

  return (
    <div className="max-w-3xl mx-auto p-8 print:p-0">
      <style>{`@media print { .no-print { display: none } body { background: #fff } }`}</style>
      <div className="no-print flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">{view === "student" ? "학생 활동지" : "교사 지도안"} · 브라우저 인쇄(Ctrl+P)로 PDF 저장</p>
        <div className="flex gap-2">
          <a className="text-xs underline text-teal-700" href="?view=student">학생지</a>
          <a className="text-xs underline text-teal-700" href="?view=teacher">교사지</a>
          <button type="button" className="text-xs px-3 py-1 border rounded" onClick={() => window.print()}>인쇄</button>
        </div>
      </div>
      <header className="mb-6 border-b pb-3">
        <h1 className="text-xl font-bold">{view === "student" ? "읽기 활동지" : "수업 지도안"}</h1>
        <p className="text-sm text-slate-500">
          {GRADE_KO[built.grade] ?? built.grade} · 수업 {built.minutes}분
          {view === "student" && " · 이름: ____________"}
        </p>
      </header>
      <LessonBuildView built={built} view={view} />
    </div>
  )
}

export default function PrintPage() {
  return <Suspense fallback={null}><PrintInner /></Suspense>
}

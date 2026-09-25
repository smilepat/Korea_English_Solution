"use client"

// 만들어진 활동 세트를 보여 준다 (M3). 교사 보기(지도 메모 포함) / 학생 보기(활동지).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import type { BuiltLesson } from "@/app/actions/lesson-build"
import type { FilledRecipe } from "@/lib/recipes/fill"
import type { Stage } from "@/lib/recipes/types"

export const STAGE_KO: Record<Stage, string> = { pre: "도입", while: "전개", post: "정리", home: "숙제" }
const GROUP_KO: Record<string, string> = { individual: "개인", pair: "짝", group: "모둠", whole: "전체" }
export const STORAGE_KEY = "kes-lesson-build"

export function FilledCard({ f, view }: { f: FilledRecipe; view: "teacher" | "student" }) {
  const r = f.recipe
  const droppedN = Object.values(f.dropped).reduce((n, a) => n + a.length, 0)
  return (
    <Card className={f.complete ? "" : "border-amber-300"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex flex-wrap items-center gap-2">
          <span>{r.titleKo}</span>
          <Badge variant="outline" className="font-normal">{r.minutes}분</Badge>
          <Badge variant="outline" className="font-normal">{GROUP_KO[r.grouping]}</Badge>
          {view === "teacher" && !f.complete && (
            <Badge variant="outline" className="font-normal bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" /> 빈칸 남음 — 교사가 채울 것
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{f.studentText}</p>
        {view === "student" && r.selfCheck && (
          <p className="text-xs text-slate-500 border-t pt-2"><span className="font-medium">스스로 확인:</span> {r.selfCheck}</p>
        )}
        {view === "teacher" && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 space-y-1">
            <p className="text-xs font-semibold text-amber-800">교사 메모</p>
            <p className="text-xs text-slate-700 whitespace-pre-wrap">{f.teacherNote}</p>
            {r.materials?.length ? <p className="text-xs text-slate-500">준비물: {r.materials.join(", ")}</p> : null}
            {droppedN > 0 && (
              <p className="text-xs text-slate-500">지문에 없어 뺀 항목 {droppedN}개 — AI 가 옮긴 것 중 원문과 다른 것은 싣지 않았습니다.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function LessonBuildView({ built, view }: { built: BuiltLesson; view: "teacher" | "student" }) {
  const order: Stage[] = ["pre", "while", "post", "home"]
  return (
    <div className="space-y-5">
      {order.map((stage) => built.stages[stage].length > 0 && (
        <section key={stage} className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide text-teal-700 uppercase">
            {STAGE_KO[stage]}
            {stage !== "home" && <span className="ml-2 text-slate-400 normal-case font-normal">{built.stages[stage].reduce((m, f) => m + f.recipe.minutes, 0)}분</span>}
          </h3>
          {built.stages[stage].map((f) => <FilledCard key={f.recipe.id} f={f} view={view} />)}
        </section>
      ))}
    </div>
  )
}

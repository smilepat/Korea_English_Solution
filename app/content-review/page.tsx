"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, X, Loader2, ShieldCheck } from "lucide-react"
import {
  listPendingPassages,
  reviewPassage,
  type PendingPassage,
} from "@/app/actions/content"

export default function ContentReview() {
  const [pending, setPending] = useState<PendingPassage[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setPending(await listPendingPassages())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function decide(textId: string, status: "approved" | "rejected") {
    setBusy(textId)
    const r = await reviewPassage({ textId, status })
    setBusy(null)
    if (r.ok) setPending((p) => p.filter((x) => x.textId !== textId))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/worksheets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> 스튜디오
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <ShieldCheck className="h-6 w-6 text-teal-600" /> AI 생성 지문 검토
            </h1>
            <p className="text-sm text-slate-500">
              AI가 생성한 초등 보충 지문입니다. 승인하면 워크시트에 쓰이고, 거부하면 숨겨집니다.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-slate-500">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-teal-400" />
              <p className="font-semibold">검토할 지문이 없습니다</p>
              <p className="text-sm text-slate-400">
                모든 AI 생성 지문이 검토되었습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">검토 대기 {pending.length}개</p>
            <div className="space-y-3">
              {pending.map((p) => (
                <Card key={p.textId}>
                  <CardContent className="py-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-slate-800">{p.topic}</span>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <Badge variant="outline">{p.lexileScore}L</Badge>
                          <span>{p.genre}</span>
                          <span>· {p.wordCount}단어</span>
                          <span>· {p.gradeHint}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-teal-300 text-teal-700 hover:bg-teal-50"
                          disabled={busy === p.textId}
                          onClick={() => decide(p.textId, "approved")}
                        >
                          <Check className="mr-1 h-4 w-4" /> 승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          disabled={busy === p.textId}
                          onClick={() => decide(p.textId, "rejected")}
                        >
                          <X className="mr-1 h-4 w-4" /> 거부
                        </Button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {p.textBody}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

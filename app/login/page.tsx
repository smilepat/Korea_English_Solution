"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginWithDemo, loginWithCredentials } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Loader2, Sparkles, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDemo = async () => {
    setDemoLoading(true)
    setError("")
    await loginWithDemo()
    router.push("/")
    router.refresh()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await loginWithCredentials(email, password)
    if (result.success) {
      router.push("/")
      router.refresh()
    } else {
      setError(result.error ?? "로그인 실패")
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail("demo@korea-english.com")
    setPassword("demo1234")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 로고 영역 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg mb-2">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">대한민국 영어교육 개선 시스템</h1>
          <p className="text-slate-500 text-sm">교사 AI 코파일럿 · Teacher AI Copilot</p>
        </div>

        {/* 데모 로그인 버튼 */}
        <button
          type="button"
          onClick={handleDemo}
          disabled={demoLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70"
        >
          {demoLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          데모로 바로 시작하기
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">또는 계정으로 로그인</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* 일반 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                required
                placeholder="demo@korea-english.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                required
                minLength={4}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !email || !password}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            로그인
          </Button>

          <button
            type="button"
            onClick={fillDemo}
            className="w-full text-xs text-slate-400 hover:text-blue-600 transition-colors py-1"
          >
            데모 계정 정보 자동 입력
          </button>
        </form>

        {/* 데모 계정 안내 */}
        <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
          <p className="font-medium">데모 계정</p>
          <p>이메일: demo@korea-english.com</p>
          <p>비밀번호: demo1234</p>
        </div>
      </div>
    </div>
  )
}

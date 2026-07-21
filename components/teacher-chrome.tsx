"use client"

import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { logout } from "@/app/actions/auth"

// 교사 크롬(로그아웃 버튼)은 교사 화면에서만 보인다.
// 학생 자가진단(/s)·로그인 화면에는 교사 UI 를 노출하지 않는다.
const HIDE_PREFIXES = ["/s/", "/login"]

export function TeacherChrome({ hasSession }: { hasSession: boolean }) {
  const pathname = usePathname()
  if (!hasSession) return null
  if (HIDE_PREFIXES.some((p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p))) {
    return null
  }
  return (
    <header className="fixed top-0 right-0 z-50 p-3">
      <form action={logout}>
        <button
          type="submit"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm transition-all backdrop-blur-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </form>
    </header>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { getSession, logout } from '@/app/actions/auth'
import { GraduationCap, LogOut } from 'lucide-react'

export const metadata: Metadata = {
  title: '대한민국 영어교육 개선 시스템',
  description: '교사 AI 코파일럿 - Teacher AI Copilot',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  return (
    <html lang="ko">
      <body>
        {session && (
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
        )}
        {children}
      </body>
    </html>
  )
}

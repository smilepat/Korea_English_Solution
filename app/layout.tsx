import type { Metadata } from 'next'
import './globals.css'
import { getSession } from '@/app/actions/auth'
import { TeacherChrome } from '@/components/teacher-chrome'

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
        <TeacherChrome hasSession={Boolean(session)} />
        {children}
      </body>
    </html>
  )
}

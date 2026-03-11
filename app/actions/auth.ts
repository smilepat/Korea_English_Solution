"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const DEMO_EMAIL = "demo@korea-english.com"
const DEMO_PASSWORD = "demo1234"
const SESSION_COOKIE = "kes_session"

export async function loginWithDemo(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "demo", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  })
  return { success: true }
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, "demo", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    return { success: true }
  }
  return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect("/login")
}

export async function getSession() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

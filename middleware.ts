import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login"]
// 로그인 없이 공개 접근 허용(교육과정 데이터는 KOGL 제1유형)
const OPEN_PREFIXES = ["/curriculum-search"]

export function middleware(request: NextRequest) {
  const session = request.cookies.get("kes_session")?.value
  const { pathname } = request.nextUrl

  // 공개 페이지: 세션 여부와 무관하게 접근 허용
  if (OPEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    if (session) return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}

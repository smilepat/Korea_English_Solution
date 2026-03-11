import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login"]

export function middleware(request: NextRequest) {
  const session = request.cookies.get("kes_session")?.value
  const { pathname } = request.nextUrl

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

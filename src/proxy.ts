import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

// AUTH_BYPASS_DEV=true trong .env → bỏ qua auth hoàn toàn khi test local.
// KHÔNG dùng trong production.
export default process.env.AUTH_BYPASS_DEV === "true"
  ? (_req: NextRequest) => NextResponse.next()
  : auth

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

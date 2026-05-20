import type { NextAuthConfig } from "next-auth"

/**
 * Config edge-compatible: không import Prisma, bcrypt hoặc bất kỳ
 * module Node.js nào. Dùng cho Next.js middleware chạy ở Edge Runtime.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 giờ
  },
  // Cho phép cookie hoạt động trên HTTP (production không có HTTPS)
  useSecureCookies: process.env.AUTH_URL?.startsWith("https") ?? false,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const isPublicPath =
        pathname === "/login" || pathname === "/register"
      const isApiAuth = pathname.startsWith("/api/auth")

      if (isApiAuth) return true

      if (isPublicPath) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      return isLoggedIn
    },
  },
  providers: [],
}

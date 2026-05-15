import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

type RouteContext = { params: Promise<Record<string, string>> }
type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>

/**
 * HOF bảo vệ Route Handler — yêu cầu đăng nhập.
 *
 * @example
 * export const GET = withAuth(async (req, ctx) => {
 *   return NextResponse.json({ ok: true })
 * })
 */
export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Bạn chưa đăng nhập" },
        { status: 401 }
      )
    }

    return handler(req, ctx)
  }
}

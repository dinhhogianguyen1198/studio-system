import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hasPermission } from "@/shared/types/rbac.types"
import type { Resource, Action } from "@/shared/types/rbac.types"

type RouteContext = { params: Promise<Record<string, string>> }
type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>

/**
 * HOF bảo vệ Route Handler — yêu cầu quyền cụ thể.
 * Trả 401 nếu chưa đăng nhập, 403 nếu không đủ quyền.
 *
 * @example
 * export const DELETE = withPermission("users", "delete")(async (req, ctx) => {
 *   const { id } = await ctx.params
 *   return NextResponse.json({ deleted: id })
 * })
 */
export function withPermission(
  resource: Resource,
  action: Action
): (handler: RouteHandler) => RouteHandler {
  return (handler) => async (req, ctx) => {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Bạn chưa đăng nhập" },
        { status: 401 }
      )
    }

    const allowed = hasPermission(session.user.role, resource, action)
    if (!allowed) {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện thao tác này" },
        { status: 403 }
      )
    }

    return handler(req, ctx)
  }
}

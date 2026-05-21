import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withPermission } from "@/shared/middleware/withPermission"
import { rbacUserService } from "@/modules/rbac/service/rbac-user.service"
import { writeAuditLog } from "@/shared/lib/audit"
import { auth } from "@/lib/auth"
import { updateUserSchema } from "@/modules/rbac/schemas/user-management.schema"
type RouteContext = { params: Promise<Record<string, string>> }

import { RBAC_ERROR_MESSAGES } from "@/modules/rbac/types/rbac-management.types"



function toErrorResponse(err: unknown) {
  if (err instanceof Error && err.message in RBAC_ERROR_MESSAGES) {
    const code = err.message as keyof typeof RBAC_ERROR_MESSAGES
    const status =
      code === "USER_NOT_FOUND" ? 404
        : code === "CANNOT_CHANGE_OWN_ROLE" ? 403
          : 400
    return NextResponse.json({ error: RBAC_ERROR_MESSAGES[code] }, { status })
  }
  return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 })
}

// ─── GET /api/rbac/users/:id ──────────────────────────────────────────────────

export const GET = withPermission(
  "users",
  "read"
)(async (_req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params
  try {
    const user = await rbacUserService.getUser(id)
    return NextResponse.json(user)
  } catch (err) {
    return toErrorResponse(err)
  }
})

// ─── PUT /api/rbac/users/:id ──────────────────────────────────────────────────

export const PUT = withPermission(
  "users",
  "update"
)(async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth()
  const { id } = await ctx.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body không hợp lệ" }, { status: 400 })
  }

  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    )
  }

  try {
    const user = await rbacUserService.updateUser(
      id,
      parsed.data,
      session!.user.id
    )

    await writeAuditLog({
      userId: session?.user.id,
      action: "UPDATE",
      resource: "users",
      resourceId: id,
      metadata: { changes: parsed.data },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return NextResponse.json(user)
  } catch (err) {
    return toErrorResponse(err)
  }
})

// ─── DELETE /api/rbac/users/:id ──────────────────────────────────────────────

export const DELETE = withPermission(
  "users",
  "delete"
)(async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth()
  const { id } = await ctx.params

  try {
    await rbacUserService.deleteUser(id, session!.user.id)

    await writeAuditLog({
      userId: session?.user.id,
      action: "DELETE",
      resource: "users",
      resourceId: id,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return toErrorResponse(err)
  }
})

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withPermission } from "@/shared/middleware/withPermission"
import { rbacRoleService } from "@/modules/rbac/service/rbac-role.service"
import { writeAuditLog } from "@/shared/lib/audit"
import { auth } from "@/lib/auth"
import { updateRoleSchema } from "@/modules/rbac/schemas/role.schema"
type RouteContext = { params: Promise<Record<string, string>> }

import { RBAC_ERROR_MESSAGES } from "@/modules/rbac/types/rbac-management.types"



function toErrorResponse(err: unknown) {
  if (err instanceof Error && err.message in RBAC_ERROR_MESSAGES) {
    const code = err.message as keyof typeof RBAC_ERROR_MESSAGES
    const status =
      code === "ROLE_NOT_FOUND" ? 404
        : code === "ROLE_IS_SYSTEM" ? 403
          : 400
    return NextResponse.json({ error: RBAC_ERROR_MESSAGES[code] }, { status })
  }
  return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 })
}

// ─── GET /api/rbac/roles/:id ──────────────────────────────────────────────────

export const GET = withPermission(
  "roles",
  "read"
)(async (_req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params
  try {
    const role = await rbacRoleService.getRole(id)
    return NextResponse.json(role)
  } catch (err) {
    return toErrorResponse(err)
  }
})

// ─── PUT /api/rbac/roles/:id ──────────────────────────────────────────────────

export const PUT = withPermission(
  "roles",
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

  const parsed = updateRoleSchema.safeParse(body)
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
    const role = await rbacRoleService.updateRole(id, parsed.data, session!.user.id)

    await writeAuditLog({
      userId: session?.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: id,
      metadata: { description: role.description },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return NextResponse.json(role)
  } catch (err) {
    return toErrorResponse(err)
  }
})

// ─── DELETE /api/rbac/roles/:id — soft delete ─────────────────────────────────

export const DELETE = withPermission(
  "roles",
  "delete"
)(async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth()
  const { id } = await ctx.params

  try {
    await rbacRoleService.deleteRole(id, session!.user.id)

    await writeAuditLog({
      userId: session?.user.id,
      action: "DELETE",
      resource: "roles",
      resourceId: id,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return toErrorResponse(err)
  }
})

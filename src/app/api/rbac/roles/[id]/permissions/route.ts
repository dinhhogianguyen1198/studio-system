import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withPermission } from "@/shared/middleware/withPermission"
import { rbacRoleService } from "@/modules/rbac/service/rbac-role.service"
import { writeAuditLog } from "@/shared/lib/audit"
import { auth } from "@/lib/auth"
import {
  assignPermissionSchema,
  bulkAssignPermissionsSchema,
} from "@/modules/rbac/schemas/role.schema"
type RouteContext = { params: Promise<Record<string, string>> }

import { RBAC_ERROR_MESSAGES } from "@/modules/rbac/types/rbac-management.types"



function toErrorResponse(err: unknown) {
  if (err instanceof Error && err.message in RBAC_ERROR_MESSAGES) {
    const code = err.message as keyof typeof RBAC_ERROR_MESSAGES
    const status =
      code === "ROLE_NOT_FOUND" || code === "PERMISSION_NOT_FOUND" ? 404
        : code === "ROLE_ALREADY_HAS_PERMISSION" ? 409
          : 400
    return NextResponse.json({ error: RBAC_ERROR_MESSAGES[code] }, { status })
  }
  return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 })
}

// ─── GET /api/rbac/roles/:id/permissions ─────────────────────────────────────

export const GET = withPermission(
  "roles",
  "read"
)(async (_req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params
  try {
    const permissions = await rbacRoleService.getRolePermissions(id)
    return NextResponse.json({ data: permissions })
  } catch (err) {
    return toErrorResponse(err)
  }
})

// ─── POST /api/rbac/roles/:id/permissions — assign permission ─────────────────

export const POST = withPermission(
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

  // Hỗ trợ cả single (permissionId) và bulk (permissionIds)
  const isBulk = Array.isArray((body as Record<string, unknown>)?.permissionIds)

  if (isBulk) {
    const parsed = bulkAssignPermissionsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 422 }
      )
    }

    try {
      const result = await rbacRoleService.bulkAssignPermissions(
        id,
        parsed.data.permissionIds,
        session!.user.id
      )

      await writeAuditLog({
        userId: session?.user.id,
        action: "UPDATE",
        resource: "roles",
        resourceId: id,
        metadata: { action: "BULK_ASSIGN_PERMISSIONS", count: parsed.data.permissionIds.length },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
        userAgent: req.headers.get("user-agent") ?? undefined,
      })

      return NextResponse.json({ data: result }, { status: 201 })
    } catch (err) {
      return toErrorResponse(err)
    }
  }

  const parsed = assignPermissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 422 }
    )
  }

  try {
    const result = await rbacRoleService.assignPermission(
      id,
      parsed.data.permissionId,
      session!.user.id
    )

    await writeAuditLog({
      userId: session?.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: id,
      metadata: { action: "ASSIGN_PERMISSION", permissionId: parsed.data.permissionId },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
})

// ─── PUT /api/rbac/roles/:id/permissions — replace all permissions ────────────

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

  // Body: { permissionIds: string[] }
  const permissionIds = (body as Record<string, unknown>)?.permissionIds
  if (!Array.isArray(permissionIds)) {
    return NextResponse.json(
      { error: "permissionIds phải là mảng" },
      { status: 422 }
    )
  }

  try {
    const result = await rbacRoleService.replacePermissions(
      id,
      permissionIds as string[],
      session!.user.id
    )

    await writeAuditLog({
      userId: session?.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: id,
      metadata: { action: "REPLACE_PERMISSIONS", count: permissionIds.length },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    return toErrorResponse(err)
  }
})

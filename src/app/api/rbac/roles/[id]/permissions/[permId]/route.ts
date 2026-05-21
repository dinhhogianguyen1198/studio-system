import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withPermission } from "@/shared/middleware/withPermission"
import { rbacRoleService } from "@/modules/rbac/service/rbac-role.service"
import { writeAuditLog } from "@/shared/lib/audit"
import { auth } from "@/lib/auth"
type RouteContext = { params: Promise<Record<string, string>> }

import { RBAC_ERROR_MESSAGES } from "@/modules/rbac/types/rbac-management.types"



// ─── DELETE /api/rbac/roles/:id/permissions/:permId — revoke permission ───────

export const DELETE = withPermission(
  "roles",
  "update"
)(async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth()
  const { id, permId } = await ctx.params

  try {
    await rbacRoleService.revokePermission(id, permId)

    await writeAuditLog({
      userId: session?.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: id,
      metadata: { action: "REVOKE_PERMISSION", permissionId: permId },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof Error && err.message in RBAC_ERROR_MESSAGES) {
      const code = err.message as keyof typeof RBAC_ERROR_MESSAGES
      const status =
        code === "ROLE_NOT_FOUND" || code === "ROLE_DOES_NOT_HAVE_PERMISSION" ? 404
          : 400
      return NextResponse.json({ error: RBAC_ERROR_MESSAGES[code] }, { status })
    }
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 })
  }
})

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withPermission } from "@/shared/middleware/withPermission"
import { rbacUserService } from "@/modules/rbac/service/rbac-user.service"
import { writeAuditLog } from "@/shared/lib/audit"
import { auth } from "@/lib/auth"
type RouteContext = { params: Promise<Record<string, string>> }

import { RBAC_ERROR_MESSAGES } from "@/modules/rbac/types/rbac-management.types"



// ─── DELETE /api/rbac/users/:id/roles/:roleId — revoke role ──────────────────

export const DELETE = withPermission(
  "users",
  "update"
)(async (req: NextRequest, ctx: RouteContext) => {
  const session = await auth()
  const { id, roleId } = await ctx.params

  try {
    await rbacUserService.revokeRole(id, roleId, session!.user.id)

    await writeAuditLog({
      userId: session?.user.id,
      action: "UPDATE",
      resource: "users",
      resourceId: id,
      metadata: { action: "REVOKE_ROLE", roleId },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof Error && err.message in RBAC_ERROR_MESSAGES) {
      const code = err.message as keyof typeof RBAC_ERROR_MESSAGES
      const status =
        code === "USER_NOT_FOUND" || code === "USER_DOES_NOT_HAVE_ROLE" ? 404
          : code === "CANNOT_CHANGE_OWN_ROLE" ? 403
            : 400
      return NextResponse.json({ error: RBAC_ERROR_MESSAGES[code] }, { status })
    }
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 })
  }
})

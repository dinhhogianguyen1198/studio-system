import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withPermission } from "@/shared/middleware/withPermission"
import { rbacPermissionService } from "@/modules/rbac/service/rbac-permission.service"
import { permissionFilterSchema } from "@/modules/rbac/schemas/permission.schema"

// ─── GET /api/rbac/permissions ────────────────────────────────────────────────

export const GET = withPermission(
  "permissions",
  "read"
)(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl
  const rawFilters = {
    resource: searchParams.get("resource") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    page: searchParams.get("page") ?? "1",
    pageSize: searchParams.get("pageSize") ?? "100",
    grouped: searchParams.get("grouped") ?? undefined,
  }

  // ?grouped=true → trả về nhóm theo resource (dùng cho permission matrix)
  if (rawFilters.grouped === "true") {
    const grouped = await rbacPermissionService.getGroupedPermissions()
    return NextResponse.json({ data: grouped })
  }

  const parsed = permissionFilterSchema.safeParse(rawFilters)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Tham số không hợp lệ" },
      { status: 400 }
    )
  }

  const result = await rbacPermissionService.listPermissions(parsed.data)
  return NextResponse.json(result)
})

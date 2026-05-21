import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withPermission } from "@/shared/middleware/withPermission"
import { rbacRoleService } from "@/modules/rbac/service/rbac-role.service"
import { writeAuditLog } from "@/shared/lib/audit"
import { auth } from "@/lib/auth"
import {
  roleFilterSchema,
  createRoleSchema,
} from "@/modules/rbac/schemas/role.schema"
import { RBAC_ERROR_MESSAGES } from "@/modules/rbac/types/rbac-management.types"

// ─── GET /api/rbac/roles ──────────────────────────────────────────────────────

export const GET = withPermission("roles", "read")(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl
  const rawFilters = {
    search: searchParams.get("search") ?? undefined,
    includeDeleted: searchParams.get("includeDeleted") ?? undefined,
    page: searchParams.get("page") ?? "1",
    pageSize: searchParams.get("pageSize") ?? "20",
  }

  const parsed = roleFilterSchema.safeParse(rawFilters)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Tham số không hợp lệ" },
      { status: 400 }
    )
  }

  const result = await rbacRoleService.listRoles(parsed.data)
  return NextResponse.json(result)
})

// ─── POST /api/rbac/roles ─────────────────────────────────────────────────────

export const POST = withPermission(
  "roles",
  "create"
)(async (req: NextRequest) => {
  const session = await auth()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body không hợp lệ" }, { status: 400 })
  }

  const parsed = createRoleSchema.safeParse(body)
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
    const role = await rbacRoleService.createRole(parsed.data, session!.user.id)

    await writeAuditLog({
      userId: session?.user.id,
      action: "CREATE",
      resource: "roles",
      resourceId: role.id,
      metadata: { name: role.name },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return NextResponse.json(role, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message in RBAC_ERROR_MESSAGES) {
      const code = err.message as keyof typeof RBAC_ERROR_MESSAGES
      return NextResponse.json(
        { error: RBAC_ERROR_MESSAGES[code] },
        { status: code === "ROLE_ALREADY_EXISTS" ? 409 : 400 }
      )
    }
    return NextResponse.json({ error: "Tạo vai trò thất bại" }, { status: 500 })
  }
})

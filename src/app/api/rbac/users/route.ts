import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withPermission } from "@/shared/middleware/withPermission"
import { rbacUserService } from "@/modules/rbac/service/rbac-user.service"
import { rbacUserRepository } from "@/modules/rbac/repository/rbac-user.repository"
import { rbacRoleRepository } from "@/modules/rbac/repository/rbac-role.repository"
import { writeAuditLog } from "@/shared/lib/audit"
import { hashPassword } from "@/shared/lib/password"
import { auth } from "@/lib/auth"
import {
  userFilterSchema,
  createUserSchema,
} from "@/modules/rbac/schemas/user-management.schema"
import { RBAC_ERROR_MESSAGES } from "@/modules/rbac/types/rbac-management.types"

// ─── GET /api/rbac/users — list users ────────────────────────────────────────

export const GET = withPermission("users", "read")(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl
  const rawFilters = {
    search: searchParams.get("search") ?? undefined,
    roleId: searchParams.get("roleId") ?? undefined,
    page: searchParams.get("page") ?? "1",
    pageSize: searchParams.get("pageSize") ?? "20",
  }

  const parsed = userFilterSchema.safeParse(rawFilters)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Tham số không hợp lệ" },
      { status: 400 }
    )
  }

  const result = await rbacUserService.listUsers(parsed.data)
  return NextResponse.json(result)
})

// ─── POST /api/rbac/users — create user ──────────────────────────────────────

export const POST = withPermission(
  "users",
  "create"
)(async (req: NextRequest) => {
  const session = await auth()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body không hợp lệ" }, { status: 400 })
  }

  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    )
  }

  const existing = await rbacUserRepository.findByEmail(parsed.data.email)
  if (existing) {
    return NextResponse.json(
      { error: RBAC_ERROR_MESSAGES.DUPLICATE_EMAIL },
      { status: 409 }
    )
  }

  const role = await rbacRoleRepository.findById(parsed.data.roleId)
  if (!role || role.deletedAt) {
    return NextResponse.json(
      { error: RBAC_ERROR_MESSAGES.ROLE_NOT_FOUND },
      { status: 404 }
    )
  }

  const hashedPassword = await hashPassword(parsed.data.password)
  const user = await rbacUserRepository.create({
    email: parsed.data.email,
    name: parsed.data.name,
    password: hashedPassword,
    roleId: parsed.data.roleId,
  })

  await writeAuditLog({
    userId: session?.user.id,
    action: "CREATE",
    resource: "users",
    resourceId: user.id,
    metadata: { email: user.email, name: user.name },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  })

  return NextResponse.json(user, { status: 201 })
})

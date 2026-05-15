import "server-only"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { hasPermission } from "@/shared/types/rbac.types"
import type { Resource, Action, RoleWithPermissions } from "@/shared/types/rbac.types"
import type { Session } from "next-auth"

// ─── Dev bypass ───────────────────────────────────────────────────────────────
// Dùng khi AUTH_BYPASS_DEV=true trong .env để test mà không cần đăng nhập.

const DEV_BYPASS = process.env.AUTH_BYPASS_DEV === "true"

const DEV_ROLE: RoleWithPermissions = {
  id: "dev-role-id",
  name: "owner",
  permissions: [
    "users", "roles", "permissions", "settings", "audit_logs",
    "crm_customers", "crm_leads", "bookings",
    "service_catalog", "workflow_templates", "orders", "order_items",
    "order_payments", "order_item_workflow", "order_item_assignment",
    "workforce_workers", "workforce_job_types", "workforce_assignments", "workforce_payroll",
  ].flatMap((resource) =>
    ["create", "read", "update", "delete", "manage"].map((action) => ({
      permission: { action, resource },
    }))
  ),
}

// Cache user thật từ DB để dùng làm createdById trong dev mode
let _devUserId: string | null = null

async function getDevUserId(): Promise<string> {
  if (_devUserId) return _devUserId
  const { db } = await import("@/shared/lib/prisma")

  // Lấy user có sẵn
  const existing = await db.user.findFirst({ select: { id: true } })
  if (existing) {
    _devUserId = existing.id
    return existing.id
  }

  // Không có user → tự tạo role + user dev để tránh FK error
  const role = await db.role.upsert({
    where: { name: "owner" },
    update: {},
    create: { name: "owner", description: "Dev owner" },
  })

  const { hashPassword } = await import("@/shared/lib/password")
  const user = await db.user.create({
    data: {
      email: "dev@local",
      name: "Dev User",
      password: await hashPassword("Dev@123456"),
      roleId: role.id,
    },
    select: { id: true },
  })

  _devUserId = user.id
  return user.id
}

async function buildDevSession(): Promise<Session> {
  const userId = await getDevUserId()
  return {
    user: {
      id: userId,
      email: "dev@local",
      name: "Dev User",
      image: null,
      roleId: "dev-role-id",
      role: DEV_ROLE,
    },
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  } satisfies Session
}

// ─── Auth utils ───────────────────────────────────────────────────────────────

export async function getSession() {
  if (DEV_BYPASS) return buildDevSession()
  return auth()
}

export async function requireSession() {
  if (DEV_BYPASS) return buildDevSession()
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session
}

export async function requirePermission(resource: Resource, action: Action) {
  if (DEV_BYPASS) return buildDevSession()
  const session = await requireSession()
  const allowed = hasPermission(session.user.role, resource, action)
  if (!allowed) redirect("/403")
  return session
}

export async function getCurrentUser() {
  if (DEV_BYPASS) return (await buildDevSession()).user
  const session = await auth()
  return session?.user ?? null
}

export async function checkPermission(
  resource: Resource,
  action: Action
): Promise<boolean> {
  if (DEV_BYPASS) return true
  const session = await auth()
  if (!session?.user) return false
  return hasPermission(session.user.role, resource, action)
}

"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import { rbacUserService } from "../service/rbac-user.service"
import {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
} from "../schemas/user-management.schema"
import { RBAC_ERROR_MESSAGES } from "../types/rbac-management.types"
import type { ActionResult } from "@/shared/types/api.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRbacError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message in RBAC_ERROR_MESSAGES) {
    return RBAC_ERROR_MESSAGES[err.message as keyof typeof RBAC_ERROR_MESSAGES]
  }
  return toActionError(err, fallback)
}

async function getRequestMeta() {
  const h = await headers()
  return {
    ipAddress: h.get("x-forwarded-for") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  }
}

// ─── Create user ──────────────────────────────────────────────────────────────

export async function createUserAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("users", "create")

  const raw = Object.fromEntries(formData)
  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    }
  }

  try {
    const user = await rbacUserService.createUser(parsed.data, session.user.id)
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "users",
      resourceId: user.id,
      metadata: { email: user.email, name: user.name, roleId: parsed.data.roleId },
      ...meta,
    })

    revalidatePath("/dashboard/settings/users")

    return { success: true, data: { id: user.id } }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Tạo người dùng thất bại") }
  }
}

// ─── Update user ──────────────────────────────────────────────────────────────

export async function updateUserAction(
  userId: string,
  _prevState: ActionResult<{ id: string }>,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("users", "update")

  const raw = Object.fromEntries(formData)
  const parsed = updateUserSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    }
  }

  try {
    const user = await rbacUserService.updateUser(
      userId,
      parsed.data,
      session.user.id
    )
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "users",
      resourceId: userId,
      metadata: { changes: parsed.data },
      ...meta,
    })

    revalidatePath("/dashboard/settings/users")

    return { success: true, data: { id: user.id } }
  } catch (err) {
    return {
      success: false,
      error: toRbacError(err, "Cập nhật người dùng thất bại"),
    }
  }
}

// ─── Delete user ──────────────────────────────────────────────────────────────

export async function deleteUserAction(
  userId: string
): Promise<ActionResult<void>> {
  const session = await requirePermission("users", "delete")

  try {
    await rbacUserService.deleteUser(userId, session.user.id)
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "users",
      resourceId: userId,
      ...meta,
    })

    revalidatePath("/dashboard/settings/users")

    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: toRbacError(err, "Xóa người dùng thất bại"),
    }
  }
}

// ─── Assign / revoke role ─────────────────────────────────────────────────────

export async function assignRoleToUserAction(
  userId: string,
  _prevState: ActionResult<void>,
  formData: FormData
): Promise<ActionResult<void>> {
  const session = await requirePermission("users", "update")

  const parsed = assignRoleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    }
  }

  try {
    await rbacUserService.assignRole(
      userId,
      parsed.data.roleId,
      session.user.id
    )
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "users",
      resourceId: userId,
      metadata: { action: "ASSIGN_ROLE", roleId: parsed.data.roleId },
      ...meta,
    })

    revalidatePath("/dashboard/settings/users")

    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: toRbacError(err, "Gán vai trò thất bại"),
    }
  }
}

export async function revokeRoleFromUserAction(
  userId: string,
  roleId: string
): Promise<ActionResult<void>> {
  const session = await requirePermission("users", "update")

  try {
    await rbacUserService.revokeRole(userId, roleId, session.user.id)
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "users",
      resourceId: userId,
      metadata: { action: "REVOKE_ROLE", roleId },
      ...meta,
    })

    revalidatePath("/dashboard/settings/users")

    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: toRbacError(err, "Thu hồi vai trò thất bại"),
    }
  }
}

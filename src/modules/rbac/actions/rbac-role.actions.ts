"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import { rbacRoleService } from "../service/rbac-role.service"
import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema,
  bulkAssignPermissionsSchema,
} from "../schemas/role.schema"
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

// ─── Create role ──────────────────────────────────────────────────────────────

export async function createRoleAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("roles", "create")

  const parsed = createRoleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    }
  }

  try {
    const role = await rbacRoleService.createRole(parsed.data, session.user.id)
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "roles",
      resourceId: role.id,
      metadata: { name: role.name, description: role.description },
      ...meta,
    })

    revalidatePath("/dashboard/settings/roles")

    return { success: true, data: { id: role.id } }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Tạo vai trò thất bại") }
  }
}

// ─── Update role ──────────────────────────────────────────────────────────────

export async function updateRoleAction(
  roleId: string,
  _prevState: ActionResult<{ id: string }>,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("roles", "update")

  const parsed = updateRoleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    }
  }

  try {
    const role = await rbacRoleService.updateRole(
      roleId,
      parsed.data,
      session.user.id
    )
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: roleId,
      metadata: { description: role.description },
      ...meta,
    })

    revalidatePath("/dashboard/settings/roles")
    revalidatePath(`/dashboard/settings/roles/${roleId}`)

    return { success: true, data: { id: role.id } }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Cập nhật vai trò thất bại") }
  }
}

// ─── Delete role (soft) ───────────────────────────────────────────────────────

export async function deleteRoleAction(
  roleId: string
): Promise<ActionResult<void>> {
  const session = await requirePermission("roles", "delete")

  try {
    await rbacRoleService.deleteRole(roleId, session.user.id)
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "roles",
      resourceId: roleId,
      ...meta,
    })

    revalidatePath("/dashboard/settings/roles")

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Xóa vai trò thất bại") }
  }
}

// ─── Restore role ─────────────────────────────────────────────────────────────

export async function restoreRoleAction(
  roleId: string
): Promise<ActionResult<void>> {
  const session = await requirePermission("roles", "update")

  try {
    await rbacRoleService.restoreRole(roleId, session.user.id)
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: roleId,
      metadata: { action: "RESTORE" },
      ...meta,
    })

    revalidatePath("/dashboard/settings/roles")

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Khôi phục vai trò thất bại") }
  }
}

// ─── Assign / revoke permission ───────────────────────────────────────────────

export async function assignPermissionToRoleAction(
  roleId: string,
  _prevState: ActionResult<void>,
  formData: FormData
): Promise<ActionResult<void>> {
  const session = await requirePermission("roles", "update")

  const parsed = assignPermissionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    }
  }

  try {
    await rbacRoleService.assignPermission(
      roleId,
      parsed.data.permissionId,
      session.user.id
    )
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: roleId,
      metadata: { action: "ASSIGN_PERMISSION", permissionId: parsed.data.permissionId },
      ...meta,
    })

    revalidatePath("/dashboard/settings/roles")

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Gán quyền thất bại") }
  }
}

export async function revokePermissionFromRoleAction(
  roleId: string,
  permissionId: string
): Promise<ActionResult<void>> {
  const session = await requirePermission("roles", "update")

  try {
    await rbacRoleService.revokePermission(roleId, permissionId)
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: roleId,
      metadata: { action: "REVOKE_PERMISSION", permissionId },
      ...meta,
    })

    revalidatePath("/dashboard/settings/roles")

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Thu hồi quyền thất bại") }
  }
}

// ─── Get role permission IDs (for AssignPermissionModal initial state) ────────

export async function getRolePermissionIdsAction(
  roleId: string
): Promise<ActionResult<string[]>> {
  await requirePermission("roles", "read")

  try {
    const permissions = await rbacRoleService.getRolePermissions(roleId)
    return {
      success: true,
      data: permissions.map((rp) => rp.permission.id),
    }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Không thể tải quyền của vai trò") }
  }
}

// ─── Replace all permissions (matrix update) ──────────────────────────────────

export async function replaceRolePermissionsAction(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult<void>> {
  const session = await requirePermission("roles", "update")

  const parsed = bulkAssignPermissionsSchema.safeParse({ permissionIds })
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Danh sách quyền không hợp lệ",
    }
  }

  try {
    await rbacRoleService.replacePermissions(
      roleId,
      parsed.data.permissionIds,
      session.user.id
    )
    const meta = await getRequestMeta()

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "roles",
      resourceId: roleId,
      metadata: { action: "REPLACE_PERMISSIONS", count: permissionIds.length },
      ...meta,
    })

    revalidatePath("/dashboard/settings/roles")

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toRbacError(err, "Cập nhật quyền thất bại") }
  }
}

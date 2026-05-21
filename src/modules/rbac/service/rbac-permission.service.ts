import { rbacPermissionRepository } from "../repository/rbac-permission.repository"
import type { PermissionFilters, RbacErrorCode } from "../types/rbac-management.types"

// ─── Service ──────────────────────────────────────────────────────────────────

export const rbacPermissionService = {
  async listPermissions(filters: PermissionFilters) {
    return rbacPermissionRepository.findMany(filters)
  },

  async getPermission(id: string) {
    const permission = await rbacPermissionRepository.findById(id)
    if (!permission)
      throw new Error("PERMISSION_NOT_FOUND" satisfies RbacErrorCode)
    return permission
  },

  async getAllPermissions() {
    return rbacPermissionRepository.findAll()
  },

  /**
   * Trả về permissions nhóm theo resource — dùng cho UI permission matrix.
   */
  async getGroupedPermissions() {
    return rbacPermissionRepository.findGroupedByResource()
  },
}

import { rbacRoleRepository } from "../repository/rbac-role.repository"
import { rbacPermissionRepository } from "../repository/rbac-permission.repository"
import type { RoleFilters, RbacErrorCode } from "../types/rbac-management.types"
import type {
  CreateRoleInput,
  UpdateRoleInput,
} from "../schemas/role.schema"

// ─── Service ──────────────────────────────────────────────────────────────────

export const rbacRoleService = {
  async listRoles(filters: RoleFilters) {
    return rbacRoleRepository.findMany(filters)
  },

  async getAllRoles() {
    return rbacRoleRepository.findAll()
  },

  async getRole(id: string) {
    const role = await rbacRoleRepository.findById(id)
    if (!role) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    return role
  },

  async createRole(data: CreateRoleInput, createdById: string) {
    const existing = await rbacRoleRepository.findByName(data.name)
    if (existing && !existing.deletedAt) {
      throw new Error("ROLE_ALREADY_EXISTS" satisfies RbacErrorCode)
    }

    return rbacRoleRepository.create({
      name: data.name,
      description: data.description || undefined,
      createdById,
    })
  },

  async updateRole(
    id: string,
    data: UpdateRoleInput,
    updatedById: string
  ) {
    const role = await rbacRoleRepository.findById(id)
    if (!role) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    if (role.deletedAt) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    // System roles: only description can be updated, name is immutable
    // (name is intentionally not in UpdateRoleInput)

    return rbacRoleRepository.update(id, {
      description: data.description || undefined,
      updatedById,
    })
  },

  async deleteRole(id: string, deletedById: string) {
    const role = await rbacRoleRepository.findById(id)
    if (!role) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    if (role.deletedAt) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    if (role.isSystem) throw new Error("ROLE_IS_SYSTEM" satisfies RbacErrorCode)

    return rbacRoleRepository.softDelete(id, deletedById)
  },

  async restoreRole(id: string, restoredById: string) {
    const role = await rbacRoleRepository.findById(id)
    if (!role) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    if (!role.deletedAt) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)

    return rbacRoleRepository.restore(id, restoredById)
  },

  // ── Permission assignment ─────────────────────────────────────────────────

  async getRolePermissions(roleId: string) {
    const role = await rbacRoleRepository.findById(roleId)
    if (!role) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    return role.permissions
  },

  async assignPermission(
    roleId: string,
    permissionId: string,
    assignedById: string
  ) {
    const [role, permission] = await Promise.all([
      rbacRoleRepository.findById(roleId),
      rbacPermissionRepository.findById(permissionId),
    ])

    if (!role || role.deletedAt)
      throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    if (!permission)
      throw new Error("PERMISSION_NOT_FOUND" satisfies RbacErrorCode)

    const existing = await rbacRoleRepository.findRolePermission(
      roleId,
      permissionId
    )
    if (existing)
      throw new Error(
        "ROLE_ALREADY_HAS_PERMISSION" satisfies RbacErrorCode
      )

    return rbacRoleRepository.assignPermission(roleId, permissionId, assignedById)
  },

  async revokePermission(roleId: string, permissionId: string) {
    const role = await rbacRoleRepository.findById(roleId)
    if (!role) throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)

    const existing = await rbacRoleRepository.findRolePermission(
      roleId,
      permissionId
    )
    if (!existing)
      throw new Error(
        "ROLE_DOES_NOT_HAVE_PERMISSION" satisfies RbacErrorCode
      )

    return rbacRoleRepository.revokePermission(roleId, permissionId)
  },

  async bulkAssignPermissions(
    roleId: string,
    permissionIds: string[],
    assignedById: string
  ) {
    const role = await rbacRoleRepository.findById(roleId)
    if (!role || role.deletedAt)
      throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)

    const validPermissions = await rbacPermissionRepository.findManyByIds(
      permissionIds
    )
    if (validPermissions.length !== permissionIds.length) {
      throw new Error("PERMISSION_NOT_FOUND" satisfies RbacErrorCode)
    }

    return rbacRoleRepository.bulkAssignPermissions(
      roleId,
      permissionIds,
      assignedById
    )
  },

  /**
   * Replace tất cả permissions của role bằng danh sách mới.
   * Dùng cho UI matrix checkbox — gửi toàn bộ trạng thái.
   */
  async replacePermissions(
    roleId: string,
    permissionIds: string[],
    updatedById: string
  ) {
    const role = await rbacRoleRepository.findById(roleId)
    if (!role || role.deletedAt)
      throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)

    if (permissionIds.length > 0) {
      const validPermissions = await rbacPermissionRepository.findManyByIds(
        permissionIds
      )
      if (validPermissions.length !== permissionIds.length) {
        throw new Error("PERMISSION_NOT_FOUND" satisfies RbacErrorCode)
      }
    }

    return rbacRoleRepository.replacePermissions(roleId, permissionIds, updatedById)
  },
}

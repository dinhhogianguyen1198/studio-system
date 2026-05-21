import { Prisma } from "@prisma/client"
import { hashPassword } from "@/shared/lib/password"
import { rbacUserRepository } from "../repository/rbac-user.repository"
import { rbacRoleRepository } from "../repository/rbac-role.repository"
import type {
  UserManagementFilters,
  RbacErrorCode,
} from "../types/rbac-management.types"
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../schemas/user-management.schema"

// ─── Service ──────────────────────────────────────────────────────────────────

export const rbacUserService = {
  async listUsers(filters: UserManagementFilters) {
    return rbacUserRepository.findMany(filters)
  },

  async getUser(id: string) {
    const user = await rbacUserRepository.findById(id)
    if (!user) throw new Error("USER_NOT_FOUND" satisfies RbacErrorCode)
    return user
  },

  async createUser(data: CreateUserInput, createdById: string) {
    const existing = await rbacUserRepository.findByEmail(data.email)
    if (existing) throw new Error("DUPLICATE_EMAIL" satisfies RbacErrorCode)

    const role = await rbacRoleRepository.findById(data.roleId)
    if (!role || role.deletedAt)
      throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)

    const hashedPassword = await hashPassword(data.password)

    return rbacUserRepository.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      roleId: data.roleId,
    })
  },

  async updateUser(
    id: string,
    data: UpdateUserInput,
    requesterId: string
  ) {
    if (id === requesterId && data.roleId) {
      throw new Error("CANNOT_CHANGE_OWN_ROLE" satisfies RbacErrorCode)
    }

    const user = await rbacUserRepository.findById(id)
    if (!user) throw new Error("USER_NOT_FOUND" satisfies RbacErrorCode)

    if (data.roleId) {
      const role = await rbacRoleRepository.findById(data.roleId)
      if (!role || role.deletedAt)
        throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)
    }

    return rbacUserRepository.update(id, {
      name: data.name,
      roleId: data.roleId,
    })
  },

  async deleteUser(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new Error("CANNOT_CHANGE_OWN_ROLE" satisfies RbacErrorCode)
    }
    const user = await rbacUserRepository.findById(id)
    if (!user) throw new Error("USER_NOT_FOUND" satisfies RbacErrorCode)

    try {
      return await rbacUserRepository.delete(id)
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2003"
      ) {
        throw new Error("Không thể xóa người dùng có dữ liệu liên kết")
      }
      throw err
    }
  },

  // ── Multi-role management ────────────────────────────────────────────────

  async getUserRoles(userId: string) {
    const user = await rbacUserRepository.findById(userId)
    if (!user) throw new Error("USER_NOT_FOUND" satisfies RbacErrorCode)
    return rbacUserRepository.getUserRoles(userId)
  },

  async assignRole(
    userId: string,
    roleId: string,
    assignedById: string
  ) {
    const [user, role] = await Promise.all([
      rbacUserRepository.findById(userId),
      rbacRoleRepository.findById(roleId),
    ])

    if (!user) throw new Error("USER_NOT_FOUND" satisfies RbacErrorCode)
    if (!role || role.deletedAt)
      throw new Error("ROLE_NOT_FOUND" satisfies RbacErrorCode)

    const existing = await rbacUserRepository.findUserRole(userId, roleId)
    if (existing)
      throw new Error("USER_ALREADY_HAS_ROLE" satisfies RbacErrorCode)

    return rbacUserRepository.assignRole(userId, roleId, assignedById)
  },

  async revokeRole(
    userId: string,
    roleId: string,
    requesterId: string
  ) {
    if (userId === requesterId) {
      throw new Error("CANNOT_CHANGE_OWN_ROLE" satisfies RbacErrorCode)
    }

    const user = await rbacUserRepository.findById(userId)
    if (!user) throw new Error("USER_NOT_FOUND" satisfies RbacErrorCode)

    const existing = await rbacUserRepository.findUserRole(userId, roleId)
    if (!existing)
      throw new Error("USER_DOES_NOT_HAVE_ROLE" satisfies RbacErrorCode)

    return rbacUserRepository.revokeRole(userId, roleId)
  },
}

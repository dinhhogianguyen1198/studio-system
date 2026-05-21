import { db } from "@/shared/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { RoleFilters } from "../types/rbac-management.types"

// ─── Reusable select fragments ────────────────────────────────────────────────

const roleSummarySelect = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  deletedAt: true,
  createdAt: true,
  _count: {
    select: {
      users: true,
      userRoles: true,
      permissions: true,
    },
  },
} as const satisfies Prisma.RoleSelect

const rolePermissionSelect = {
  assignedAt: true,
  permission: {
    select: { id: true, action: true, resource: true, description: true },
  },
} as const satisfies Prisma.RolePermissionSelect

const roleDetailSelect = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { users: true, userRoles: true, permissions: true },
  },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  permissions: {
    select: rolePermissionSelect,
    orderBy: [
      { permission: { resource: "asc" as const } },
      { permission: { action: "asc" as const } },
    ],
  },
} as const satisfies Prisma.RoleSelect

// ─── Repository ───────────────────────────────────────────────────────────────

export const rbacRoleRepository = {
  async findMany(filters: RoleFilters) {
    const { search, includeDeleted = false, page, pageSize } = filters
    const skip = (page - 1) * pageSize

    const where: Prisma.RoleWhereInput = {
      ...(!includeDeleted && { deletedAt: null }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      db.role.findMany({
        where,
        select: roleSummarySelect,
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        skip,
        take: pageSize,
      }),
      db.role.count({ where }),
    ])

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  },

  async findAll() {
    return db.role.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    })
  },

  async findById(id: string) {
    return db.role.findUnique({
      where: { id },
      select: roleDetailSelect,
    })
  },

  async findByName(name: string) {
    return db.role.findUnique({
      where: { name },
      select: { id: true, name: true, isSystem: true, deletedAt: true },
    })
  },

  async create(data: {
    name: string
    description?: string
    createdById: string
  }) {
    return db.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        createdById: data.createdById,
        updatedById: data.createdById,
      },
      select: roleDetailSelect,
    })
  },

  async update(
    id: string,
    data: { description?: string; updatedById: string }
  ) {
    return db.role.update({
      where: { id },
      data: {
        description: data.description ?? null,
        updatedById: data.updatedById,
      },
      select: roleDetailSelect,
    })
  },

  async softDelete(id: string, deletedById: string) {
    return db.role.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: deletedById },
      select: { id: true, name: true, deletedAt: true },
    })
  },

  async restore(id: string, restoredById: string) {
    return db.role.update({
      where: { id },
      data: { deletedAt: null, updatedById: restoredById },
      select: { id: true, name: true, deletedAt: true },
    })
  },

  // ── RolePermission ────────────────────────────────────────────────────────

  async findRolePermission(roleId: string, permissionId: string) {
    return db.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    })
  },

  async assignPermission(
    roleId: string,
    permissionId: string,
    assignedById: string
  ) {
    return db.rolePermission.create({
      data: { roleId, permissionId, assignedById },
      select: {
        assignedAt: true,
        permission: {
          select: { id: true, action: true, resource: true, description: true },
        },
      },
    })
  },

  async revokePermission(roleId: string, permissionId: string) {
    return db.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    })
  },

  async bulkAssignPermissions(
    roleId: string,
    permissionIds: string[],
    assignedById: string
  ) {
    return db.$transaction(async (tx) => {
      const existing = await tx.rolePermission.findMany({
        where: { roleId, permissionId: { in: permissionIds } },
        select: { permissionId: true },
      })
      const existingIds = new Set(existing.map((e) => e.permissionId))
      const newIds = permissionIds.filter((id) => !existingIds.has(id))

      if (newIds.length === 0) return []

      await tx.rolePermission.createMany({
        data: newIds.map((permissionId) => ({
          roleId,
          permissionId,
          assignedById,
        })),
      })

      return tx.rolePermission.findMany({
        where: { roleId, permissionId: { in: newIds } },
        select: {
          assignedAt: true,
          permission: {
            select: { id: true, action: true, resource: true, description: true },
          },
        },
      })
    })
  },

  async replacePermissions(
    roleId: string,
    permissionIds: string[],
    assignedById: string
  ) {
    return db.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } })
      if (permissionIds.length === 0) return []
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
          assignedById,
        })),
      })
      return tx.rolePermission.findMany({
        where: { roleId },
        select: {
          assignedAt: true,
          permission: {
            select: { id: true, action: true, resource: true, description: true },
          },
        },
      })
    })
  },
}

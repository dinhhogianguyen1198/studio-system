import { atomicBatch, insertRow } from "@/shared/lib/d1"
import { db } from "@/shared/lib/prisma"
import type { Prisma } from "@prisma/client/edge"
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
          { name: { contains: search } },
          { description: { contains: search } },
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
    const ids = [...new Set(permissionIds)]
    await atomicBatch(ids.map((permissionId) => {
      const statement = insertRow("role_permissions", { roleId, permissionId, assignedById })
      return { ...statement, sql: statement.sql + ' ON CONFLICT("roleId", "permissionId") DO NOTHING' }
    }))
    return db.rolePermission.findMany({
      where: { roleId, permissionId: { in: ids } }, select: rolePermissionSelect,
    })
  },

  async replacePermissions(
    roleId: string,
    permissionIds: string[],
    assignedById: string
  ) {
    await atomicBatch([
      { sql: 'DELETE FROM role_permissions WHERE "roleId" = ?', values: [roleId] },
      ...[...new Set(permissionIds)].map((permissionId) => insertRow("role_permissions", { roleId, permissionId, assignedById })),
    ])
    return db.rolePermission.findMany({ where: { roleId }, select: rolePermissionSelect })
  },
}

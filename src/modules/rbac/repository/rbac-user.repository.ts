import { db } from "@/shared/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { UserManagementFilters } from "../types/rbac-management.types"

// ─── Reusable select fragments ────────────────────────────────────────────────

const userSummarySelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  createdAt: true,
  role: {
    select: { id: true, name: true, isSystem: true },
  },
  userRoles: {
    select: {
      id: true,
      assignedAt: true,
      role: { select: { id: true, name: true, isSystem: true } },
      assignedBy: { select: { id: true, name: true } },
    },
    orderBy: { assignedAt: "asc" as const },
  },
} as const satisfies Prisma.UserSelect

const userDetailSelect = {
  ...userSummarySelect,
  emailVerified: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect

// ─── Repository ───────────────────────────────────────────────────────────────

export const rbacUserRepository = {
  async findMany(filters: UserManagementFilters) {
    const { search, roleId, page, pageSize } = filters
    const skip = (page - 1) * pageSize

    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(roleId && { roleId }),
    }

    const [data, total] = await Promise.all([
      db.user.findMany({
        where,
        select: userSummarySelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.user.count({ where }),
    ])

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  },

  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      select: userDetailSelect,
    })
  },

  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })
  },

  async create(data: {
    email: string
    name: string
    password: string
    roleId: string
  }) {
    return db.user.create({
      data,
      select: userSummarySelect,
    })
  },

  async update(
    id: string,
    data: { name?: string; roleId?: string }
  ) {
    return db.user.update({
      where: { id },
      data,
      select: userSummarySelect,
    })
  },

  async updatePassword(id: string, hashedPassword: string) {
    return db.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true },
    })
  },

  async delete(id: string) {
    return db.user.delete({ where: { id } })
  },

  // ── UserRole (multi-role) ──────────────────────────────────────────────────

  async findUserRole(userId: string, roleId: string) {
    return db.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    })
  },

  async assignRole(userId: string, roleId: string, assignedById: string) {
    return db.userRole.create({
      data: { userId, roleId, assignedById },
      select: {
        id: true,
        assignedAt: true,
        role: { select: { id: true, name: true, isSystem: true } },
        assignedBy: { select: { id: true, name: true } },
      },
    })
  },

  async revokeRole(userId: string, roleId: string) {
    return db.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    })
  },

  async getUserRoles(userId: string) {
    return db.userRole.findMany({
      where: { userId },
      select: {
        id: true,
        assignedAt: true,
        role: { select: { id: true, name: true, isSystem: true } },
        assignedBy: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: "asc" },
    })
  },

  async countByRole() {
    return db.user.groupBy({
      by: ["roleId"],
      _count: { _all: true },
    })
  },
}

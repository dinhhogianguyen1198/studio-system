import { db } from "@/shared/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { PermissionFilters } from "../types/rbac-management.types"

// ─── Reusable select fragments ────────────────────────────────────────────────

const permissionSummarySelect = {
  id: true,
  action: true,
  resource: true,
  description: true,
  _count: { select: { roles: true } },
} as const satisfies Prisma.PermissionSelect

// ─── Repository ───────────────────────────────────────────────────────────────

export const rbacPermissionRepository = {
  async findMany(filters: PermissionFilters) {
    const { resource, action, page, pageSize } = filters
    const skip = (page - 1) * pageSize

    const where: Prisma.PermissionWhereInput = {
      deletedAt: null,
      ...(resource && { resource }),
      ...(action && { action }),
    }

    const [data, total] = await Promise.all([
      db.permission.findMany({
        where,
        select: permissionSummarySelect,
        orderBy: [{ resource: "asc" }, { action: "asc" }],
        skip,
        take: pageSize,
      }),
      db.permission.count({ where }),
    ])

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  },

  async findAll() {
    return db.permission.findMany({
      where: { deletedAt: null },
      select: permissionSummarySelect,
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    })
  },

  async findById(id: string) {
    return db.permission.findUnique({
      where: { id },
      select: permissionSummarySelect,
    })
  },

  async findByActionResource(action: string, resource: string) {
    return db.permission.findUnique({
      where: { action_resource: { action, resource } },
      select: { id: true, action: true, resource: true },
    })
  },

  async findManyByIds(ids: string[]) {
    return db.permission.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, action: true, resource: true },
    })
  },

  /**
   * Nhóm permissions theo resource.
   * Dùng cho UI matrix (checkbox grid).
   */
  async findGroupedByResource() {
    const permissions = await db.permission.findMany({
      where: { deletedAt: null },
      select: permissionSummarySelect,
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    })

    const grouped = new Map<string, typeof permissions>()
    for (const p of permissions) {
      const existing = grouped.get(p.resource) ?? []
      existing.push(p)
      grouped.set(p.resource, existing)
    }

    return Array.from(grouped.entries()).map(([resource, items]) => ({
      resource,
      permissions: items,
    }))
  },
}

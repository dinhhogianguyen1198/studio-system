import "server-only"
import { unstable_cache } from "next/cache"
import { db } from "@/shared/lib/prisma"
import type { RoleWithPermissions } from "@/shared/types/rbac.types"

/**
 * Cache TTL in seconds.
 * Permissions are reloaded after this period OR when revalidateRoleCache() is called.
 */
const CACHE_TTL = 300 // 5 minutes

async function loadRole(roleId: string): Promise<RoleWithPermissions | null> {
  return db.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      permissions: {
        select: {
          permission: {
            select: { action: true, resource: true },
          },
        },
      },
    },
  })
}

/**
 * Load RoleWithPermissions from cache.
 * Cache is keyed per roleId and tagged for targeted invalidation.
 *
 * Call revalidateRoleCache(roleId) after any permission change to propagate
 * new permissions to all active sessions without waiting for TTL expiry.
 */
export function getCachedRole(roleId: string): Promise<RoleWithPermissions | null> {
  return unstable_cache(
    () => loadRole(roleId),
    [`role-perms:${roleId}`],
    { revalidate: CACHE_TTL, tags: [`role:${roleId}`, "permissions"] },
  )()
}

/**
 * Fallback role when DB is unreachable — no permissions granted.
 * The caller should handle this as a degraded state.
 */
export function emptyRole(roleId: string, roleName = "unknown"): RoleWithPermissions {
  return { id: roleId, name: roleName, permissions: [] }
}

"use client"

import { useSession } from "next-auth/react"
import {
  hasPermission,
  hasAnyRole,
  hasAllRoles,
} from "@/shared/types/rbac.types"
import type { Resource, Action, RoleWithPermissions } from "@/shared/types/rbac.types"

// ─── useRbac ──────────────────────────────────────────────────────────────────
/**
 * Hook chính cho permission/role check ở Client Components.
 *
 * @example
 * const { can, hasRole } = useRbac()
 * if (can("users", "create")) { ... }
 * if (hasRole("admin")) { ... }
 */
export function useRbac() {
  const { data: session } = useSession()
  const role = session?.user?.role ?? null

  function can(resource: Resource, action: Action): boolean {
    if (!role) return false
    return hasPermission(role, resource, action)
  }

  function canAny(checks: Array<[Resource, Action]>): boolean {
    return checks.some(([resource, action]) => can(resource, action))
  }

  function canAll(checks: Array<[Resource, Action]>): boolean {
    return checks.every(([resource, action]) => can(resource, action))
  }

  function hasRole(roleName: string): boolean {
    if (!role) return false
    return role.name === roleName
  }

  function hasAnyRoleName(roleNames: string[]): boolean {
    if (!role) return false
    return hasAnyRole([role], roleNames)
  }

  function hasAllRoleNames(roleNames: string[]): boolean {
    if (!role) return false
    return hasAllRoles([role], roleNames)
  }

  function isOwner(): boolean {
    return hasRole("owner")
  }

  function isAdmin(): boolean {
    return hasAnyRoleName(["owner", "admin"])
  }

  return {
    role,
    userId: session?.user?.id ?? null,
    isAuthenticated: !!session?.user,
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRoleName,
    hasAllRoleNames,
    isOwner,
    isAdmin,
  }
}

// ─── usePermissionGuard ───────────────────────────────────────────────────────
/**
 * Guard hook — trả về { allowed, isLoading } để ẩn/hiện UI elements.
 *
 * @example
 * const { allowed } = usePermissionGuard("users", "delete")
 * if (!allowed) return null
 */
export function usePermissionGuard(resource: Resource, action: Action) {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  const allowed =
    !isLoading &&
    !!session?.user?.role &&
    hasPermission(session.user.role, resource, action)

  return { allowed, isLoading }
}

// ─── useRoleGuard ─────────────────────────────────────────────────────────────
/**
 * Guard hook cho role check.
 *
 * @example
 * const { allowed } = useRoleGuard(["admin", "owner"])
 */
export function useRoleGuard(roleNames: string[]) {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  const role = session?.user?.role
  const allowed =
    !isLoading &&
    !!role &&
    hasAnyRole([role as RoleWithPermissions], roleNames)

  return { allowed, isLoading }
}

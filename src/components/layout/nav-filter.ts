import { hasPermission } from "@/shared/types/rbac.types"
import type { NavItem } from "@/config/navigation"
import type { RoleWithPermissions } from "@/shared/types/rbac.types"

/**
 * Filters nav items based on the user's role permissions.
 * Items without a `permission` field are always visible (authenticated users).
 */
export function filterNavByPermissions(
  items: NavItem[],
  role: RoleWithPermissions
): NavItem[] {
  return items.filter((item) => {
    if (!item.permission) return true
    return hasPermission(role, item.permission.resource, item.permission.action)
  })
}

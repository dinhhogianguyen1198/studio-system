export type Resource =
  | "users"
  | "roles"
  | "permissions"
  | "settings"
  | "audit_logs"
  | "crm_customers"
  | "crm_leads"
  | "bookings"
  | "service_catalog"
  | "orders"
  | "order_items"
  | "order_payments"
  | "order_item_assignment"
  | "workforce_workers"
  | "workforce_job_types"
  | "workforce_assignments"
  | "workforce_payroll"
  | "order_management_units"
  | "finance_dashboard"
  | "finance_expenses"
  | "finance_invoices"
  | "finance_payroll"
  | "finance_accounts"
  | "finance_reports"

export type Action = "create" | "read" | "update" | "delete" | "manage" | "approve"

export type PermissionString = `${Resource}:${Action}`

export interface RoleWithPermissions {
  id: string
  name: string
  permissions: Array<{
    permission: {
      action: string
      resource: string
    }
  }>
}

// ─── Single-role permission check (session primary role) ─────────────────────

/**
 * Kiểm tra xem một role có quyền thực hiện action trên resource không.
 * "manage" trên một resource = toàn quyền trên resource đó.
 */
export function hasPermission(
  role: RoleWithPermissions,
  resource: Resource,
  action: Action
): boolean {
  return role.permissions.some(
    (rp) =>
      (rp.permission.resource === resource && rp.permission.action === action) ||
      (rp.permission.resource === resource && rp.permission.action === "manage")
  )
}

// ─── Multi-role helpers ───────────────────────────────────────────────────────

/**
 * Kiểm tra nhiều roles — dùng khi user có nhiều role (UserRole table).
 * Trả true nếu BẤT KỲ role nào trong danh sách có quyền.
 */
export function hasPermissionInRoles(
  roles: RoleWithPermissions[],
  resource: Resource,
  action: Action
): boolean {
  return roles.some((role) => hasPermission(role, resource, action))
}

/**
 * Kiểm tra xem user có bất kỳ role nào trong danh sách không.
 */
export function hasAnyRole(
  roles: RoleWithPermissions[],
  roleNames: string[]
): boolean {
  const roleNameSet = new Set(roleNames)
  return roles.some((r) => roleNameSet.has(r.name))
}

/**
 * Kiểm tra xem user có tất cả roles trong danh sách không.
 */
export function hasAllRoles(
  roles: RoleWithPermissions[],
  roleNames: string[]
): boolean {
  const userRoleNames = new Set(roles.map((r) => r.name))
  return roleNames.every((name) => userRoleNames.has(name))
}

/**
 * Merge permissions từ nhiều roles thành một tập hợp không trùng.
 * Dùng để hiển thị effective permissions của user.
 */
export function mergeRolePermissions(
  roles: RoleWithPermissions[]
): Array<{ resource: string; action: string }> {
  const seen = new Set<string>()
  const result: Array<{ resource: string; action: string }> = []

  for (const role of roles) {
    for (const rp of role.permissions) {
      const key = `${rp.permission.resource}:${rp.permission.action}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push(rp.permission)
      }
    }
  }
  return result
}

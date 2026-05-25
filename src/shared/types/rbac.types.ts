export type Resource =
  | "users"
  | "roles"
  | "permissions"
  | "settings"
  | "audit_logs"
  | "crm_customers"
  | "crm_leads"
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
  | "production_kanban"
  | "production_calendar"

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

export function hasAnyRole(
  roles: RoleWithPermissions[],
  roleNames: string[]
): boolean {
  return roles.some((role) => roleNames.includes(role.name))
}

export function hasAllRoles(
  roles: RoleWithPermissions[],
  roleNames: string[]
): boolean {
  return roleNames.every((name) => roles.some((role) => role.name === name))
}


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
  | "workflow_templates"
  | "orders"
  | "order_items"
  | "order_payments"
  | "order_item_workflow"
  | "order_item_assignment"
  | "workforce_workers"
  | "workforce_job_types"
  | "workforce_assignments"
  | "workforce_payroll"

export type Action = "create" | "read" | "update" | "delete" | "manage"

export type Permission = `${Resource}:${Action}`

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

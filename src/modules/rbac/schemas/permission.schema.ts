import { z } from "zod"
import type { Resource, Action } from "@/shared/types/rbac.types"

// ─── Permission schemas ───────────────────────────────────────────────────────

const RESOURCES: [Resource, ...Resource[]] = [
  "users", "roles", "permissions", "settings", "audit_logs",
  "crm_customers", "crm_leads", "bookings",
  "service_catalog", "workflow_templates",
  "orders", "order_items", "order_payments",
  "order_item_workflow", "order_item_assignment",
  "workforce_workers", "workforce_job_types",
  "workforce_assignments", "workforce_payroll",
]

const ACTIONS: [Action, ...Action[]] = [
  "create", "read", "update", "delete", "manage",
]

export const permissionFilterSchema = z.object({
  resource: z.enum(RESOURCES).optional(),
  action: z.enum(ACTIONS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(100),
})

export type PermissionFilterInput = z.infer<typeof permissionFilterSchema>

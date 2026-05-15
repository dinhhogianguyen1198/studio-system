import { db } from "../client"

interface SeedRole {
  name: string
  description: string
  permissions: Array<{ action: string; resource: string }>
}

const ROLES: SeedRole[] = [
  {
    name: "owner",
    description: "Owner — toàn quyền tuyệt đối, không thể bị thu hồi",
    permissions: [
      { action: "manage", resource: "users" },
      { action: "manage", resource: "roles" },
      { action: "manage", resource: "permissions" },
      { action: "manage", resource: "settings" },
      { action: "manage", resource: "audit_logs" },
      { action: "manage", resource: "crm_customers" },
      { action: "manage", resource: "crm_leads" },
      { action: "manage", resource: "bookings" },
      { action: "manage", resource: "service_catalog" },
      { action: "manage", resource: "workflow_templates" },
      { action: "manage", resource: "orders" },
      { action: "manage", resource: "order_items" },
      { action: "manage", resource: "order_payments" },
      { action: "manage", resource: "order_item_workflow" },
      { action: "manage", resource: "order_item_assignment" },
      { action: "manage", resource: "workforce_workers" },
      { action: "manage", resource: "workforce_job_types" },
      { action: "manage", resource: "workforce_assignments" },
      { action: "manage", resource: "workforce_payroll" },
    ],
  },
  {
    name: "admin",
    description: "Quản trị viên — toàn quyền hệ thống, trừ audit_logs",
    permissions: [
      { action: "manage", resource: "users" },
      { action: "manage", resource: "roles" },
      { action: "manage", resource: "permissions" },
      { action: "manage", resource: "settings" },
      { action: "read", resource: "audit_logs" },
      { action: "manage", resource: "crm_customers" },
      { action: "manage", resource: "crm_leads" },
      { action: "manage", resource: "bookings" },
      { action: "manage", resource: "service_catalog" },
      { action: "manage", resource: "workflow_templates" },
      { action: "manage", resource: "orders" },
      { action: "manage", resource: "order_items" },
      { action: "manage", resource: "order_payments" },
      { action: "manage", resource: "order_item_workflow" },
      { action: "manage", resource: "order_item_assignment" },
      { action: "manage", resource: "workforce_workers" },
      { action: "manage", resource: "workforce_job_types" },
      { action: "manage", resource: "workforce_assignments" },
      { action: "manage", resource: "workforce_payroll" },
    ],
  },
  {
    name: "manager",
    description: "Quản lý — quản lý orders, dịch vụ, phân công nhân sự",
    permissions: [
      { action: "read", resource: "users" },
      { action: "update", resource: "users" },
      { action: "read", resource: "roles" },
      { action: "read", resource: "settings" },
      { action: "create", resource: "crm_customers" },
      { action: "read", resource: "crm_customers" },
      { action: "update", resource: "crm_customers" },
      { action: "create", resource: "crm_leads" },
      { action: "read", resource: "crm_leads" },
      { action: "update", resource: "crm_leads" },
      { action: "read", resource: "bookings" },
      { action: "create", resource: "bookings" },
      { action: "update", resource: "bookings" },
      { action: "read", resource: "service_catalog" },
      { action: "create", resource: "service_catalog" },
      { action: "update", resource: "service_catalog" },
      { action: "read", resource: "workflow_templates" },
      { action: "create", resource: "orders" },
      { action: "read", resource: "orders" },
      { action: "update", resource: "orders" },
      { action: "create", resource: "order_items" },
      { action: "read", resource: "order_items" },
      { action: "update", resource: "order_items" },
      { action: "delete", resource: "order_items" },
      { action: "create", resource: "order_payments" },
      { action: "read", resource: "order_payments" },
      { action: "read", resource: "order_item_workflow" },
      { action: "update", resource: "order_item_workflow" },
      { action: "create", resource: "order_item_assignment" },
      { action: "read", resource: "order_item_assignment" },
      { action: "update", resource: "order_item_assignment" },
      { action: "create", resource: "workforce_workers" },
      { action: "read", resource: "workforce_workers" },
      { action: "update", resource: "workforce_workers" },
      { action: "delete", resource: "workforce_workers" },
      { action: "create", resource: "workforce_job_types" },
      { action: "read", resource: "workforce_job_types" },
      { action: "update", resource: "workforce_job_types" },
      { action: "delete", resource: "workforce_job_types" },
      { action: "create", resource: "workforce_assignments" },
      { action: "read", resource: "workforce_assignments" },
      { action: "update", resource: "workforce_assignments" },
      { action: "delete", resource: "workforce_assignments" },
      { action: "read", resource: "workforce_payroll" },
    ],
  },
  {
    name: "staff",
    description: "Nhân viên — xem orders, cập nhật workflow item được giao",
    permissions: [
      { action: "read", resource: "settings" },
      { action: "read", resource: "crm_customers" },
      { action: "read", resource: "crm_leads" },
      { action: "read", resource: "bookings" },
      { action: "read", resource: "service_catalog" },
      { action: "read", resource: "orders" },
      { action: "read", resource: "order_items" },
      { action: "read", resource: "order_payments" },
      { action: "read", resource: "order_item_workflow" },
      { action: "update", resource: "order_item_workflow" },
      { action: "read", resource: "order_item_assignment" },
      { action: "read", resource: "workforce_workers" },
      { action: "read", resource: "workforce_assignments" },
      { action: "read", resource: "workforce_payroll" },
    ],
  },
  {
    name: "user",
    description: "Người dùng thông thường — quyền tối thiểu",
    permissions: [
      { action: "read", resource: "settings" },
      { action: "read", resource: "crm_customers" },
      { action: "read", resource: "crm_leads" },
    ],
  },
]

export async function seedRoles() {
  console.log("Đang seed roles và permissions...")

  for (const roleData of ROLES) {
    const role = await db.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: { name: roleData.name, description: roleData.description },
    })

    for (const perm of roleData.permissions) {
      const permission = await db.permission.upsert({
        where: {
          action_resource: { action: perm.action, resource: perm.resource },
        },
        update: {},
        create: { action: perm.action, resource: perm.resource },
      })

      await db.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      })
    }

    console.log(`  ✓ Role "${roleData.name}" — ${roleData.permissions.length} quyền`)
  }
}

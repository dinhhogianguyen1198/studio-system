import { z } from "zod"

// ─── Role schemas ─────────────────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Tên vai trò tối thiểu 2 ký tự")
    .max(50, "Tên vai trò tối đa 50 ký tự")
    .regex(
      /^[a-z0-9_]+$/,
      "Tên vai trò chỉ được chứa chữ thường, số và dấu gạch dưới"
    ),
  description: z
    .string()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional()
    .or(z.literal("")),
})

export const updateRoleSchema = z.object({
  description: z
    .string()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional()
    .or(z.literal("")),
})

export const assignPermissionSchema = z.object({
  permissionId: z.string().min(1, "Vui lòng chọn quyền"),
})

export const bulkAssignPermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().min(1))
    .min(1, "Vui lòng chọn ít nhất một quyền"),
})

export const roleFilterSchema = z.object({
  search: z.string().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>
export type BulkAssignPermissionsInput = z.infer<typeof bulkAssignPermissionsSchema>
export type RoleFilterInput = z.infer<typeof roleFilterSchema>

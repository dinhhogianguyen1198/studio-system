import { z } from "zod"

// ─── User management schemas ──────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email("Email không hợp lệ").max(255, "Email tối đa 255 ký tự"),
  name: z
    .string()
    .min(2, "Tên tối thiểu 2 ký tự")
    .max(100, "Tên tối đa 100 ký tự"),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(72, "Mật khẩu tối đa 72 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Mật khẩu phải có chữ hoa, chữ thường và số"
    ),
  roleId: z.string().min(1, "Vui lòng chọn vai trò"),
})

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Tên tối thiểu 2 ký tự")
    .max(100, "Tên tối đa 100 ký tự")
    .optional(),
  roleId: z.string().min(1, "Vai trò không hợp lệ").optional(),
})

export const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .max(72, "Mật khẩu tối đa 72 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Mật khẩu phải có chữ hoa, chữ thường và số"
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

export const assignRoleSchema = z.object({
  roleId: z.string().min(1, "Vui lòng chọn vai trò"),
})

export const userFilterSchema = z.object({
  search: z.string().optional(),
  roleId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type AssignRoleInput = z.infer<typeof assignRoleSchema>
export type UserFilterInput = z.infer<typeof userFilterSchema>

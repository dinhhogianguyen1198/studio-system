import { z } from "zod"

export const createOrderManagementUnitSchema = z.object({
  name: z.string().min(1, "Tên không được trống").max(200),
  description: z.string().max(1000).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
})

export const updateOrderManagementUnitSchema = createOrderManagementUnitSchema.partial()

export type CreateOrderManagementUnitInput = z.infer<typeof createOrderManagementUnitSchema>
export type UpdateOrderManagementUnitInput = z.infer<typeof updateOrderManagementUnitSchema>

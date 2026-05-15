import { z } from "zod"

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createServiceDefinitionSchema = z.object({
  name: z.string().min(1, "Tên dịch vụ không được trống").max(100),
  slug: z
    .string()
    .min(1, "Slug không được trống")
    .max(100)
    .regex(slugRegex, "Slug chỉ được dùng chữ thường, số và dấu gạch ngang"),
  description: z.string().max(1000).optional(),
  defaultPrice: z.coerce.number().min(0, "Giá không được âm"),
  currency: z.string().max(10).optional(),
  defaultDurationDays: z.coerce.number().int().min(1).optional(),
  defaultSlaHours: z.coerce.number().int().min(1).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
  sortOrder: z.coerce.number().int().min(0).optional(),
  workflowTemplateId: z.string().cuid().optional().or(z.literal("")),
})

export const updateServiceDefinitionSchema = createServiceDefinitionSchema.partial()

export type CreateServiceDefinitionInput = z.infer<typeof createServiceDefinitionSchema>
export type UpdateServiceDefinitionInput = z.infer<typeof updateServiceDefinitionSchema>

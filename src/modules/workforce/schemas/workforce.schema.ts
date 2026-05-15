import { z } from "zod"

export const createWorkerSchema = z.object({
  name: z.string().min(1, "Tên không được trống").max(100),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email("Email không hợp lệ").optional().nullable().or(z.literal("")),
  avatarUrl: z.string().url("URL avatar không hợp lệ").optional().nullable().or(z.literal("")),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  jobTypeIds: z.string().transform((val) => val.split(",").filter(Boolean)),
  primaryJobTypeId: z.string().optional().nullable(),
})

export const updateWorkerSchema = createWorkerSchema.partial().extend({
  id: z.string().cuid(),
})

export const createJobTypeSchema = z.object({
  name: z.string().min(1, "Tên không được trống").max(80),
  slug: z
    .string()
    .min(1, "Slug không được trống")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và gạch ngang"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Màu phải là mã hex hợp lệ (vd: #FF5733)")
    .default("#6B7280"),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  description: z.string().max(500).optional().nullable(),
})

export const updateJobTypeSchema = createJobTypeSchema.partial().extend({
  id: z.string().cuid(),
})

export const upsertWorkerRateSchema = z.object({
  workerId: z.string().cuid(),
  jobTypeId: z.string().cuid(),
  serviceDefinitionId: z.string().cuid().optional().nullable(),
  rateType: z.enum(["PER_JOB", "HOURLY", "DAILY"]),
  amount: z.coerce.number().min(0, "Mức lương không được âm"),
  currency: z.string().default("VND"),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
})

export const assignWorkerSchema = z.object({
  orderItemId: z.string().cuid(),
  workerId: z.string().cuid(),
  jobTypeId: z.string().cuid(),
  quantity: z.coerce.number().min(0.01, "Số lượng phải lớn hơn 0"),
  notes: z.string().max(500).optional().nullable(),
})

export const updateAssignmentStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: z.string().max(500).optional().nullable(),
})

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>
export type CreateJobTypeInput = z.infer<typeof createJobTypeSchema>
export type UpdateJobTypeInput = z.infer<typeof updateJobTypeSchema>
export type UpsertWorkerRateInput = z.infer<typeof upsertWorkerRateSchema>
export type AssignWorkerInput = z.infer<typeof assignWorkerSchema>
export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>

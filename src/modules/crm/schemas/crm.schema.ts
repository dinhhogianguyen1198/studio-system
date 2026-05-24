import { z } from "zod"

// ─── Customer schemas ─────────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(200, "Tên tối đa 200 ký tự"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  address: z.string().max(500, "Địa chỉ tối đa 500 ký tự").optional().or(z.literal("")),
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(200, "Tên tối đa 200 ký tự"),
})

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ─── Lead schemas ─────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  title: z.string().min(2, "Tiêu đề tối thiểu 2 ký tự").max(300, "Tiêu đề tối đa 300 ký tự"),
  customerId: z.string().optional().or(z.literal("")),
  contactName: z
    .string()
    .min(2, "Tên liên hệ tối thiểu 2 ký tự")
    .max(200, "Tên liên hệ tối đa 200 ký tự"),
  contactEmail: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  contactPhone: z
    .string()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  value: z.coerce
    .number()
    .min(0, "Giá trị không được âm")
    .optional()
    .or(z.literal("")),
  currency: z.string().default("VND"),
  status: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"])
    .default("NEW"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  source: z
    .enum(["DIRECT", "REFERRAL", "SOCIAL_MEDIA", "WEBSITE", "EVENT", "OTHER"])
    .default("DIRECT"),
  assignedToId: z.string().optional().or(z.literal("")),
  expectedCloseDate: z.string().optional().or(z.literal("")),
})

export const updateLeadSchema = createLeadSchema.partial().extend({
  title: z.string().min(2, "Tiêu đề tối thiểu 2 ký tự").max(300, "Tiêu đề tối đa 300 ký tự"),
})

export const leadFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  source: z
    .enum(["DIRECT", "REFERRAL", "SOCIAL_MEDIA", "WEBSITE", "EVENT", "OTHER"])
    .optional(),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ─── Note schemas ─────────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Nội dung không được để trống")
    .max(5000, "Nội dung tối đa 5000 ký tự"),
})

export const updateNoteSchema = createNoteSchema

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerFilterInput = z.infer<typeof customerFilterSchema>

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type LeadFilterInput = z.infer<typeof leadFilterSchema>

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>

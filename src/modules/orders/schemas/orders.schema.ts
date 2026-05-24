import { z } from "zod"

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v)

const nullableDate = z
  .union([z.coerce.date(), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? null : v))

export const createOrderSchema = z.object({
  customerId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  contactName: z.string().min(1, "Tên liên hệ không được trống").max(100),
  contactPhone: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
  contactEmail: z.preprocess(emptyToUndefined, z.string().email("Email không hợp lệ").optional()),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  partyName: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  source: z.string().max(50).optional(),
  orderManagementUnitId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
})

export const updateOrderSchema = createOrderSchema.partial()

export const addOrderItemSchema = z.object({
  orderId: z.string().cuid("orderId không hợp lệ"),
  serviceDefinitionId: z.string().cuid("Dịch vụ không hợp lệ"),
  price: z.coerce.number().min(0, "Giá không hợp lệ"),
  quantity: z.coerce.number().int().min(1, "Số lượng tối thiểu là 1"),
  deadline: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  location: z.string().max(500).optional(),
})

export const updateOrderItemSchema = z.object({
  price: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  eventDate: nullableDate,
  deadline: nullableDate,
  notes: z.string().max(1000).optional(),
  location: z.string().max(500).optional(),
  assignedToId: z.string().cuid().optional().or(z.literal("")),
})

export const recordPaymentSchema = z.object({
  orderId: z.string().cuid(),
  type: z.enum(["DEPOSIT", "PARTIAL", "FINAL", "REFUND"]),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]),
  reference: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
  paidAt: z.coerce.date().optional(),
})

export const updatePaymentSchema = z.object({
  type: z.enum(["DEPOSIT", "PARTIAL", "FINAL", "REFUND"]),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]),
  reference: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
  paidAt: z.coerce.date().optional(),
})

export const orderItemInputSchema = z.object({
  serviceDefinitionId: z.string().cuid("ID dịch vụ không hợp lệ"),
  price: z.coerce.number().min(0, "Giá không hợp lệ"),
  quantity: z.coerce.number().int().min(1, "Số lượng tối thiểu là 1"),
  eventDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  location: z.string().max(500).optional(),
})

export const createOrderWithItemsSchema = createOrderSchema.extend({
  itemsJson: z.string().optional(),
  newCustomerAddress: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>

export const createOrderFeedbackSchema = z.object({
  orderId: z.string().cuid(),
  content: z.string().min(1, "Nội dung phản hồi không được trống").max(2000),
})

export const createIncidentalCostSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().min(1, "Tên chi phí không được trống").max(200),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  notes: z.preprocess((v) => (v === "" ? undefined : v), z.string().max(500).optional()),
})

export const updateIncidentalCostSchema = z.object({
  reason: z.string().min(1, "Tên chi phí không được trống").max(200),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  notes: z.preprocess((v) => (v === "" ? undefined : v), z.string().max(500).optional()),
})
export type OrderItemInput = z.infer<typeof orderItemInputSchema>
export type CreateOrderWithItemsInput = z.infer<typeof createOrderWithItemsSchema>

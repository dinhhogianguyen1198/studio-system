import type { Prisma } from "@prisma/client"

// ─── Select fragments ──────────────────────────────────────────────────────────

export const orderSummarySelect = {
  id: true,
  orderNumber: true,
  status: true,
  contactName: true,
  contactPhone: true,
  totalAmount: true,
  paidAmount: true,
  currency: true,
  createdAt: true,
  customer: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect

export const orderItemSummarySelect = {
  id: true,
  name: true,
  price: true,
  quantity: true,
  totalPrice: true,
  deadline: true,
  notes: true,
  serviceDefinition: { select: { id: true, name: true } },
  currentStep: { select: { id: true, key: true, name: true, color: true, isFinal: true } },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.OrderItemSelect

export const orderDetailSelect = {
  id: true,
  orderNumber: true,
  status: true,
  contactName: true,
  contactPhone: true,
  contactEmail: true,
  notes: true,
  internalNotes: true,
  subtotal: true,
  discountAmount: true,
  totalAmount: true,
  paidAmount: true,
  currency: true,
  // Schedule
  shootingDate: true,
  rawPhotoSentDate: true,
  selectionDate: true,
  editedPhotoSentDate: true,
  deliveryDate: true,
  // Classification
  category: true,
  channel: true,

  source: true,
  confirmedAt: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, name: true, phone: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  items: {
    select: orderItemSummarySelect,
    orderBy: { createdAt: "asc" as const },
  },
  payments: {
    select: {
      id: true,
      type: true,
      amount: true,
      method: true,
      reference: true,
      note: true,
      paidAt: true,
      recordedBy: { select: { id: true, name: true } },
    },
    orderBy: { paidAt: "asc" as const },
  },
} satisfies Prisma.OrderSelect

// ─── Inferred types ────────────────────────────────────────────────────────────

export type OrderSummary = Prisma.OrderGetPayload<{ select: typeof orderSummarySelect }>
export type OrderDetail = Prisma.OrderGetPayload<{ select: typeof orderDetailSelect }>
export type OrderItemSummary = Prisma.OrderItemGetPayload<{ select: typeof orderItemSummarySelect }>

// ─── Constants ─────────────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
}

export const ORDER_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Đặt cọc",
  PARTIAL: "Thanh toán một phần",
  FINAL: "Thanh toán cuối",
  REFUND: "Hoàn tiền",
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  CARD: "Thẻ",
  OTHER: "Khác",
}

// ─── Serialized types (Decimal → number) for Client Components ────────────────

export type SerializedOrderSummary = Omit<OrderSummary, "totalAmount" | "paidAmount"> & {
  totalAmount: number
  paidAmount: number
}

export type SerializedOrderItemSummary = Omit<OrderItemSummary, "price" | "totalPrice"> & {
  price: number
  totalPrice: number
}

export function serializeOrderSummary(order: OrderSummary): SerializedOrderSummary {
  return { ...order, totalAmount: Number(order.totalAmount), paidAmount: Number(order.paidAmount) }
}

export function serializeOrderItemSummary(item: OrderItemSummary): SerializedOrderItemSummary {
  return { ...item, price: Number(item.price), totalPrice: Number(item.totalPrice) }
}

// ─── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateOrderDto {
  customerId?: string
  contactName: string
  contactPhone?: string
  contactEmail?: string
  notes?: string
  internalNotes?: string
  discountAmount?: number
  status?: "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  // Schedule
  shootingDate?: Date
  rawPhotoSentDate?: Date
  selectionDate?: Date
  editedPhotoSentDate?: Date
  deliveryDate?: Date
  // Classification
  category?: string
  channel?: string

  source?: string
}

export interface UpdateOrderDto extends Partial<CreateOrderDto> {
  status?: "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
}

export interface AddOrderItemDto {
  orderId: string
  serviceDefinitionId: string
  price: number
  quantity: number
  deadline?: Date
  notes?: string
}

export interface UpdateOrderItemDto {
  price?: number
  quantity?: number
  deadline?: Date
  notes?: string
  assignedToId?: string
}

export interface RecordPaymentDto {
  orderId: string
  type: string
  amount: number
  method: string
  reference?: string
  note?: string
  paidAt?: Date
}

export interface OrderFilters {
  status?: string
  customerId?: string
  search?: string
  page: number
  pageSize: number
}

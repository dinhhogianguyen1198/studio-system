import type { Prisma } from "@prisma/client"

// ─── Select fragments ──────────────────────────────────────────────────────────

export const orderSummarySelect = {
  id: true,
  orderNumber: true,
  status: true,
  contactName: true,
  contactPhone: true,
  partyName: true,
  totalAmount: true,
  paidAmount: true,
  currency: true,
  createdAt: true,
  customer: { select: { id: true, name: true } },
  orderManagementUnit: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect

export const orderItemSummarySelect = {
  id: true,
  name: true,
  price: true,
  quantity: true,
  totalPrice: true,
  eventDate: true,
  deadline: true,
  deliveryStatus: true,
  fileDeliveredAt: true,
  notes: true,
  location: true,
  serviceDefinition: { select: { id: true, name: true, defaultDurationDays: true } },
  currentStep: { select: { id: true, key: true, name: true, color: true, isFinal: true } },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.OrderItemSelect

export const orderFeedbackSummarySelect = {
  id: true,
  content: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.OrderFeedbackSelect

export const orderIncidentalCostSummarySelect = {
  id: true,
  reason: true,
  amount: true,
  notes: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.OrderIncidentalCostSelect

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
  partyName: true,
  source: true,
  orderManagementUnitId: true,
  orderManagementUnit: { select: { id: true, name: true } },
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
  feedbacks: {
    select: orderFeedbackSummarySelect,
    orderBy: { createdAt: "desc" as const },
  },
  incidentalCosts: {
    select: orderIncidentalCostSummarySelect,
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderSelect

// ─── Inferred types ────────────────────────────────────────────────────────────

export type OrderSummary = Prisma.OrderGetPayload<{ select: typeof orderSummarySelect }>
export type OrderDetail = Prisma.OrderGetPayload<{ select: typeof orderDetailSelect }>
export type OrderItemSummary = Prisma.OrderItemGetPayload<{ select: typeof orderItemSummarySelect }>
export type OrderFeedbackSummary = Prisma.OrderFeedbackGetPayload<{ select: typeof orderFeedbackSummarySelect }>
export type OrderIncidentalCostSummary = Prisma.OrderIncidentalCostGetPayload<{ select: typeof orderIncidentalCostSummarySelect }>

// ─── Constants ─────────────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới tạo",
  WAITING_FILES: "Chờ giao file",
  PARTIAL_DELIVERY: "Giao file một phần",
  OVERDUE: "Trễ hạn giao file",
  FILES_DELIVERED: "Đã giao file",
  COMPLETED: "Hoàn thành",
}

export const ORDER_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "info" | "warning" | "success"
> = {
  NEW: "secondary",
  WAITING_FILES: "warning",
  PARTIAL_DELIVERY: "info",
  OVERDUE: "destructive",
  FILES_DELIVERED: "info",
  COMPLETED: "success",
}

export const ORDER_ITEM_DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chưa giao file",
  DELIVERED: "Đã giao file",
}

export const ORDER_ITEM_DELIVERY_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "info" | "warning" | "success"
> = {
  PENDING: "secondary",
  DELIVERED: "success",
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
  location: string | null
}

export type SerializedOrderIncidentalCostSummary = Omit<OrderIncidentalCostSummary, "amount"> & {
  amount: number
}

export function serializeIncidentalCostSummary(cost: OrderIncidentalCostSummary): SerializedOrderIncidentalCostSummary {
  return { ...cost, amount: Number(cost.amount) }
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
  partyName?: string
  source?: string
  orderManagementUnitId?: string
}

export interface UpdateOrderDto extends Partial<CreateOrderDto> {}

export interface AddOrderItemDto {
  orderId: string
  serviceDefinitionId: string
  price: number
  quantity: number
  eventDate?: Date
  deadline?: Date
  notes?: string
  location?: string
}

export interface UpdateOrderItemDto {
  price?: number
  quantity?: number
  eventDate?: Date | null
  deadline?: Date | null
  notes?: string
  location?: string
  assignedToId?: string
}

export interface UpdateOrderItemDeliveryStatusDto {
  deliveryStatus: "PENDING" | "DELIVERED"
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
  orderManagementUnitId?: string
  page: number
  pageSize: number
}

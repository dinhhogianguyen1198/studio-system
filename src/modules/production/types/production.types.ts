import type { Prisma } from "@prisma/client"

// ─── Select fragments ──────────────────────────────────────────────────────────

export const kanbanOrderSelect = {
  id: true,
  orderNumber: true,
  contactName: true,
  status: true,
  totalAmount: true,
  paidAmount: true,
  currency: true,
  createdAt: true,
  customer: { select: { id: true, name: true } },
  orderManagementUnit: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      name: true,
      deliveryStatus: true,
      deadline: true,
      eventDate: true,
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderSelect

export const calendarOrderSelect = {
  id: true,
  orderNumber: true,
  contactName: true,
  status: true,
  customer: { select: { id: true, name: true } },
  orderManagementUnit: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      eventDate: true,
      deadline: true,
      deliveryStatus: true,
    },
  },
} satisfies Prisma.OrderSelect

// ─── Raw Prisma types ──────────────────────────────────────────────────────────

type KanbanOrderRaw = Prisma.OrderGetPayload<{ select: typeof kanbanOrderSelect }>
type CalendarOrderRaw = Prisma.OrderGetPayload<{ select: typeof calendarOrderSelect }>

// ─── Application types ─────────────────────────────────────────────────────────

export type OrderPriority = "overdue" | "urgent" | "high" | "normal"

export type KanbanOrderItem = {
  id: string
  name: string
  deliveryStatus: "PENDING" | "DELIVERED"
  deadline: Date | null
  eventDate: Date | null
  assignedTo: { id: string; name: string | null } | null
}

export type KanbanOrder = {
  id: string
  orderNumber: string
  contactName: string
  status: string
  totalAmount: number
  paidAmount: number
  currency: string
  createdAt: Date
  customer: { id: string; name: string } | null
  orderManagementUnit: { id: string; name: string } | null
  items: KanbanOrderItem[]
  // Computed
  nearestEventDate: Date | null
  nearestDeadline: Date | null
  deliveredCount: number
  totalItemCount: number
  priority: OrderPriority
  isFullyPaid: boolean
  daysUntilDeadline: number | null
}

export type KanbanColumnMeta = {
  status: string
  label: string
  color: string
  isAutoComputed: boolean
  count: number
  orders: KanbanOrder[]
}

export type CalendarOrderEvent = {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    orderId: string
    orderNumber: string
    status: string
    customerName: string | null
    deliveredCount: number
    totalItemCount: number
    priority: OrderPriority
    isFullyPaid: boolean
  }
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export type ProductionKanbanFilters = {
  search?: string
  orderManagementUnitId?: string
  includeCompleted?: boolean
}

export type ProductionCalendarFilters = {
  start: Date
  end: Date
  orderManagementUnitId?: string
}

// ─── Transition ───────────────────────────────────────────────────────────────

export type KanbanTransitionType =
  | "MARK_ALL_DELIVERED"
  | "CONFIRM_COMPLETED"
  | "BLOCKED_AUTO_COMPUTED"
  | "BLOCKED_FINAL_STATE"
  | "BLOCKED_SAME_STATUS"
  | "BLOCKED_REQUIRES_PAYMENT"

export type KanbanTransitionInfo = {
  type: KanbanTransitionType
  canDrop: boolean
  actionLabel: string
  description: string
  warning?: string
}

// ─── Serialization helpers ────────────────────────────────────────────────────

function computePriority(
  items: Array<{ deliveryStatus: string; deadline: Date | null }>,
  now: Date,
): OrderPriority {
  const pendingItems = items.filter((i) => i.deliveryStatus === "PENDING")
  if (pendingItems.length === 0) return "normal"

  const overdueItems = pendingItems.filter(
    (i) => i.deadline != null && i.deadline < now,
  )
  if (overdueItems.length > 0) return "overdue"

  const urgentItems = pendingItems.filter((i) => {
    if (i.deadline == null) return false
    const diff = (i.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 2
  })
  if (urgentItems.length > 0) return "urgent"

  const highItems = pendingItems.filter((i) => {
    if (i.deadline == null) return false
    const diff = (i.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })
  if (highItems.length > 0) return "high"

  return "normal"
}

export function serializeKanbanOrder(raw: KanbanOrderRaw): KanbanOrder {
  const now = new Date()
  const items: KanbanOrderItem[] = raw.items.map((i) => ({
    id: i.id,
    name: i.name,
    deliveryStatus: i.deliveryStatus as "PENDING" | "DELIVERED",
    deadline: i.deadline,
    eventDate: i.eventDate,
    assignedTo: i.assignedTo,
  }))

  const pendingItems = items.filter((i) => i.deliveryStatus === "PENDING")
  const deliveredCount = items.filter((i) => i.deliveryStatus === "DELIVERED").length

  const deadlines = pendingItems
    .map((i) => i.deadline)
    .filter((d): d is Date => d != null)
  const eventDates = items
    .map((i) => i.eventDate)
    .filter((d): d is Date => d != null)

  const nearestDeadline =
    deadlines.length > 0
      ? new Date(Math.min(...deadlines.map((d) => d.getTime())))
      : null

  const nearestEventDate =
    eventDates.length > 0
      ? new Date(Math.min(...eventDates.map((d) => d.getTime())))
      : null

  const daysUntilDeadline =
    nearestDeadline != null
      ? Math.ceil((nearestDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

  const total = Number(raw.totalAmount)
  const paid = Number(raw.paidAmount)
  const isFullyPaid = total > 0 && paid >= total

  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    contactName: raw.contactName,
    status: raw.status,
    totalAmount: total,
    paidAmount: paid,
    currency: raw.currency,
    createdAt: raw.createdAt,
    customer: raw.customer,
    orderManagementUnit: raw.orderManagementUnit,
    items,
    nearestEventDate,
    nearestDeadline,
    deliveredCount,
    totalItemCount: items.length,
    priority: computePriority(items, now),
    isFullyPaid,
    daysUntilDeadline,
  }
}

export function serializeCalendarOrder(raw: CalendarOrderRaw): CalendarOrderEvent | null {
  const now = new Date()
  const items = raw.items

  const eventDates = items
    .map((i) => i.eventDate)
    .filter((d): d is Date => d != null)
  const deadlines = items
    .map((i) => i.deadline)
    .filter((d): d is Date => d != null)

  if (eventDates.length === 0 && deadlines.length === 0) return null

  const allDates = [...eventDates, ...deadlines]
  const start = new Date(Math.min(...allDates.map((d) => d.getTime())))
  let end = new Date(Math.max(...allDates.map((d) => d.getTime())))

  // Ensure at least 1 day duration for visibility on calendar
  if (end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  }

  const deliveredCount = items.filter((i) => i.deliveryStatus === "DELIVERED").length
  const pendingItems = items.filter((i) => i.deliveryStatus === "PENDING")

  const priority = computePriority(
    items.map((i) => ({ deliveryStatus: i.deliveryStatus, deadline: i.deadline })),
    now,
  )

  const total = 0 // not needed for calendar
  const paid = 0

  const customerName = raw.customer?.name ?? raw.contactName

  return {
    id: raw.id,
    title: `${raw.orderNumber} · ${customerName}`,
    start,
    end,
    resource: {
      orderId: raw.id,
      orderNumber: raw.orderNumber,
      status: raw.status,
      customerName,
      deliveredCount,
      totalItemCount: items.length,
      priority,
      isFullyPaid: total > 0 && paid >= total,
    },
  }
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const KANBAN_COLUMNS: Omit<KanbanColumnMeta, "count" | "orders">[] = [
  {
    status: "NEW",
    label: "Mới tạo",
    color: "hsl(var(--muted-foreground))",
    isAutoComputed: false,
  },
  {
    status: "WAITING_FILES",
    label: "Chờ giao file",
    color: "hsl(var(--warning))",
    isAutoComputed: true,
  },
  {
    status: "PARTIAL_DELIVERY",
    label: "Giao một phần",
    color: "hsl(var(--info))",
    isAutoComputed: true,
  },
  {
    status: "OVERDUE",
    label: "Trễ hạn",
    color: "hsl(var(--destructive))",
    isAutoComputed: true,
  },
  {
    status: "FILES_DELIVERED",
    label: "Đã giao file",
    color: "hsl(var(--success))",
    isAutoComputed: false,
  },
  {
    status: "COMPLETED",
    label: "Hoàn thành",
    color: "hsl(var(--primary))",
    isAutoComputed: false,
  },
]

export const ORDER_STATUS_COLOR_CLASS: Record<string, string> = {
  NEW: "text-muted-foreground",
  WAITING_FILES: "text-warning-foreground",
  PARTIAL_DELIVERY: "text-info-foreground",
  OVERDUE: "text-destructive",
  FILES_DELIVERED: "text-success-foreground",
  COMPLETED: "text-foreground",
}

export const ORDER_STATUS_BG_CLASS: Record<string, string> = {
  NEW: "bg-muted/60",
  WAITING_FILES: "bg-warning/20",
  PARTIAL_DELIVERY: "bg-info/20",
  OVERDUE: "bg-destructive/20",
  FILES_DELIVERED: "bg-success/20",
  COMPLETED: "bg-primary/10",
}

export const ORDER_STATUS_BORDER_CLASS: Record<string, string> = {
  NEW: "border-border",
  WAITING_FILES: "border-warning/40",
  PARTIAL_DELIVERY: "border-info/40",
  OVERDUE: "border-destructive/40",
  FILES_DELIVERED: "border-success/40",
  COMPLETED: "border-primary/20",
}

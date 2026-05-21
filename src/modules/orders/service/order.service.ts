import { db } from "@/shared/lib/prisma"
import { orderRepository } from "../repository/order.repository"
import type {
  CreateOrderDto,
  OrderDetail,
  OrderFilters,
  OrderSummary,
  UpdateOrderDto,
} from "../types/orders.types"
import { orderDetailSelect } from "../types/orders.types"

type OrderStatus =
  | "NEW"
  | "WAITING_FILES"
  | "PARTIAL_DELIVERY"
  | "OVERDUE"
  | "FILES_DELIVERED"
  | "COMPLETED"

type ItemSnapshot = {
  deliveryStatus: string
  deadline: Date | null
  eventDate: Date | null
}

function computeOrderStatus(
  items: ItemSnapshot[],
  paidAmount: { toString(): string },
  totalAmount: { toString(): string },
  now: Date,
): OrderStatus {
  if (items.length === 0) return "NEW"

  const allDelivered = items.every((i) => i.deliveryStatus === "DELIVERED")
  const anyDelivered = items.some((i) => i.deliveryStatus === "DELIVERED")
  const anyOverdue = items.some(
    (i) => i.deliveryStatus === "PENDING" && i.deadline != null && i.deadline < now,
  )
  const anyEventPassed = items.some((i) => i.eventDate != null && i.eventDate < now)
  const total = Number(totalAmount)
  const paid = Number(paidAmount)
  const isFullyPaid = total > 0 && paid >= total

  if (allDelivered && isFullyPaid) return "COMPLETED"
  if (anyOverdue) return "OVERDUE"
  if (allDelivered) return "FILES_DELIVERED"
  if (anyDelivered) return "PARTIAL_DELIVERY"
  if (anyEventPassed) return "WAITING_FILES"
  return "NEW"
}

export const orderService = {
  async findMany(filters: OrderFilters): Promise<{ data: OrderSummary[]; total: number }> {
    return orderRepository.findMany(filters)
  },

  async findById(id: string): Promise<OrderDetail> {
    const order = await orderRepository.findById(id)
    if (!order) throw new Error("ORDER_NOT_FOUND")
    return order
  },

  async create(data: CreateOrderDto, createdById: string): Promise<OrderDetail> {
    const orderNumber = await orderService._generateOrderNumber()
    return orderRepository.create(data, createdById, orderNumber)
  },

  async update(id: string, data: UpdateOrderDto): Promise<OrderDetail> {
    await orderService.findById(id)
    return orderRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    const order = await orderService.findById(id)
    if (!["NEW", "COMPLETED"].includes(order.status))
      throw new Error("ORDER_CANNOT_BE_DELETED")
    await orderRepository.delete(id)
  },

  async computeAndUpdateOrderStatus(id: string): Promise<void> {
    const order = await db.order.findUniqueOrThrow({
      where: { id },
      select: {
        status: true,
        paidAmount: true,
        totalAmount: true,
        items: {
          select: { deliveryStatus: true, deadline: true, eventDate: true },
        },
      },
    })
    const newStatus = computeOrderStatus(
      order.items,
      order.paidAmount,
      order.totalAmount,
      new Date(),
    )
    if (newStatus !== order.status) {
      await db.order.update({ where: { id }, data: { status: newStatus } })
    }
  },

  async autoUpdateOrderStatuses(): Promise<number> {
    const now = new Date()
    const orders = await db.order.findMany({
      where: { status: { not: "COMPLETED" } },
      select: {
        id: true,
        status: true,
        paidAmount: true,
        totalAmount: true,
        items: {
          select: { deliveryStatus: true, deadline: true, eventDate: true },
        },
      },
    })

    const toUpdate = orders.filter((o) => {
      const newStatus = computeOrderStatus(o.items, o.paidAmount, o.totalAmount, now)
      return newStatus !== o.status
    })

    if (toUpdate.length === 0) return 0

    await db.$transaction(
      toUpdate.map((o) => {
        const newStatus = computeOrderStatus(o.items, o.paidAmount, o.totalAmount, now)
        return db.order.update({ where: { id: o.id }, data: { status: newStatus } })
      }),
    )

    return toUpdate.length
  },

  async _generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const last = await orderRepository.getLastOrderNumber(year)
    const seq = last ? parseInt(last.split("-")[2], 10) + 1 : 1
    return `ORD-${year}-${String(seq).padStart(4, "0")}`
  },
}

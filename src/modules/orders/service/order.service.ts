import { atomicBatch } from "@/shared/lib/d1"
import { db } from "@/shared/lib/prisma"
import { Prisma } from "@prisma/client/edge"
import type { PaymentType, PaymentMethod } from "@prisma/client/edge"
import { orderRepository } from "../repository/order.repository"
import type {
  CreateOrderDto,
  OrderDetail,
  OrderFilters,
  OrderSummary,
  UpdateOrderDto,
} from "../types/orders.types"

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

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const rows = await db.$queryRaw<{ value: number }[]>`
    INSERT INTO number_sequences (name, value) VALUES (${`ORD-${year}`}, 1)
    ON CONFLICT(name) DO UPDATE SET value = value + 1
    RETURNING value
  `
  return `ORD-${year}-${String(rows[0].value).padStart(4, "0")}`
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
    const orderNumber = await generateOrderNumber()
    return orderRepository.create(data, createdById, orderNumber)
  },

  async update(id: string, data: UpdateOrderDto): Promise<OrderDetail> {
    try {
      return await orderRepository.update(id, data)
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "P2025"
      ) {
        throw new Error("ORDER_NOT_FOUND")
      }
      throw err
    }
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
      where: {
        status: { not: "COMPLETED" },
        items: { some: {} },
      },
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

    const statusMap = new Map<string, OrderStatus>()
    for (const o of orders) {
      const newStatus = computeOrderStatus(o.items, o.paidAmount, o.totalAmount, now)
      if (newStatus !== o.status) {
        statusMap.set(o.id, newStatus)
      }
    }

    if (statusMap.size === 0) return 0

    const grouped = new Map<OrderStatus, string[]>()
    for (const [id, status] of statusMap) {
      const ids = grouped.get(status) ?? []
      ids.push(id)
      grouped.set(status, ids)
    }

    await atomicBatch(Array.from(statusMap, ([id, status]) => ({
      sql: 'UPDATE orders SET status = ?, "updatedAt" = ? WHERE id = ?',
      values: [status, now, id],
    })))

    return statusMap.size
  },

  async recordPayment(data: {
    orderId: string
    type: string
    amount: number
    method: string
    reference?: string
    note?: string
    paidAt?: Date
    recordedById: string
  }): Promise<void> {
    await db.orderPayment.create({
      data: {
        orderId: data.orderId,
        type: data.type as PaymentType,
        amount: new Prisma.Decimal(data.amount),
        method: data.method as PaymentMethod,
        reference: data.reference,
        note: data.note,
        paidAt: data.paidAt ?? new Date(),
        recordedById: data.recordedById,
      },
    })
    await orderRepository.recalculateTotals(data.orderId)
    await orderService.computeAndUpdateOrderStatus(data.orderId)
  },
}

import { db } from "@/shared/lib/prisma"
import { Prisma } from "@prisma/client"
import type {
  CreateOrderDto,
  OrderDetail,
  OrderFilters,
  OrderSummary,
  UpdateOrderDto,
} from "../types/orders.types"
import { orderDetailSelect, orderSummarySelect } from "../types/orders.types"

export const orderRepository = {
  async findMany(
    filters: OrderFilters,
  ): Promise<{ data: OrderSummary[]; total: number }> {
    const { status, customerId, search, page, pageSize } = filters
    const where: Prisma.OrderWhereInput = {
      ...(status && { status: status as never }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { contactName: { contains: search, mode: "insensitive" } },
          { contactPhone: { contains: search, mode: "insensitive" } },
        ],
      }),
    }
    const [data, total] = await Promise.all([
      db.order.findMany({
        where,
        select: orderSummarySelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.order.count({ where }),
    ])
    return { data, total }
  },

  async findById(id: string): Promise<OrderDetail | null> {
    return db.order.findUnique({ where: { id }, select: orderDetailSelect })
  },

  async findByOrderNumber(orderNumber: string): Promise<{ id: string } | null> {
    return db.order.findUnique({ where: { orderNumber }, select: { id: true } })
  },

  async create(data: CreateOrderDto, createdById: string, orderNumber: string): Promise<OrderDetail> {
    const { customerId, discountAmount, source, ...rest } = data
    return db.order.create({
      data: {
        ...rest,
        orderNumber,
        ...(customerId && { customerId }),
        discountAmount: discountAmount ? new Prisma.Decimal(discountAmount) : new Prisma.Decimal(0),
        ...(source && { source: source as never }),
        createdById,
      },
      select: orderDetailSelect,
    })
  },

  async update(id: string, data: UpdateOrderDto): Promise<OrderDetail> {
    const { customerId, discountAmount, source, ...rest } = data
    return db.order.update({
      where: { id },
      data: {
        ...rest,
        ...(customerId !== undefined && {
          customer: customerId ? { connect: { id: customerId } } : { disconnect: true },
        }),
        ...(discountAmount !== undefined && {
          discountAmount: new Prisma.Decimal(discountAmount),
        }),
        ...(source !== undefined && { source: (source as never) || null }),
      },
      select: orderDetailSelect,
    })
  },

  async recalculateTotals(id: string): Promise<void> {
    const items = await db.orderItem.findMany({
      where: { orderId: id },
      select: { totalPrice: true },
    })
    const payments = await db.orderPayment.findMany({
      where: { orderId: id, type: { not: "REFUND" } },
      select: { amount: true, type: true },
    })
    const refunds = await db.orderPayment.findMany({
      where: { orderId: id, type: "REFUND" },
      select: { amount: true },
    })

    const order = await db.order.findUnique({
      where: { id },
      select: { discountAmount: true },
    })

    const subtotal = items.reduce((sum, i) => sum + Number(i.totalPrice), 0)
    const discount = Number(order?.discountAmount ?? 0)
    const totalAmount = Math.max(0, subtotal - discount)
    const paidAmount =
      payments.reduce((sum, p) => sum + Number(p.amount), 0) -
      refunds.reduce((sum, r) => sum + Number(r.amount), 0)

    await db.order.update({
      where: { id },
      data: {
        subtotal: new Prisma.Decimal(subtotal),
        totalAmount: new Prisma.Decimal(totalAmount),
        paidAmount: new Prisma.Decimal(Math.max(0, paidAmount)),
      },
    })
  },

  async delete(id: string): Promise<void> {
    await db.order.delete({ where: { id } })
  },

  async getLastOrderNumber(year: number): Promise<string | null> {
    const order = await db.order.findFirst({
      where: { orderNumber: { startsWith: `ORD-${year}-` } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    })
    return order?.orderNumber ?? null
  },
}

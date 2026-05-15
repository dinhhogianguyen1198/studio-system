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

  async confirm(id: string): Promise<OrderDetail> {
    const order = await orderService.findById(id)
    if (order.status !== "DRAFT") throw new Error("ORDER_ALREADY_CONFIRMED")
    return db.order.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
      select: orderDetailSelect,
    })
  },

  async complete(id: string): Promise<OrderDetail> {
    await orderService.findById(id)
    return db.order.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
      select: orderDetailSelect,
    })
  },

  async cancel(id: string): Promise<OrderDetail> {
    await orderService.findById(id)
    return db.order.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      select: orderDetailSelect,
    })
  },

  async delete(id: string): Promise<void> {
    const order = await orderService.findById(id)
    if (!["DRAFT", "CANCELLED"].includes(order.status))
      throw new Error("ORDER_CANNOT_BE_DELETED")
    await orderRepository.delete(id)
  },

  async _generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const last = await orderRepository.getLastOrderNumber(year)
    const seq = last ? parseInt(last.split("-")[2], 10) + 1 : 1
    return `ORD-${year}-${String(seq).padStart(4, "0")}`
  },
}

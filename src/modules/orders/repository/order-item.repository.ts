import { db } from "@/shared/lib/prisma"
import { Prisma } from "@prisma/client"
import type { AddOrderItemDto, OrderItemSummary, UpdateOrderItemDto } from "../types/orders.types"
import { orderItemSummarySelect } from "../types/orders.types"

export const orderItemRepository = {
  async findById(id: string): Promise<OrderItemSummary | null> {
    return db.orderItem.findUnique({ where: { id }, select: orderItemSummarySelect })
  },

  async createWithName(
    data: AddOrderItemDto,
    name: string,
  ): Promise<OrderItemSummary> {
    const { price, quantity, eventDate, deadline, orderId, serviceDefinitionId, notes } = data
    const totalPrice = price * quantity
    return db.orderItem.create({
      data: {
        orderId,
        serviceDefinitionId,
        name,
        price: new Prisma.Decimal(price),
        quantity,
        totalPrice: new Prisma.Decimal(totalPrice),
        ...(eventDate && { eventDate }),
        ...(deadline && { deadline }),
        ...(notes && { notes }),
      },
      select: orderItemSummarySelect,
    })
  },

  async update(
    id: string,
    data: UpdateOrderItemDto,
  ): Promise<OrderItemSummary & { orderId: string }> {
    // Fetch giá trị cũ (price, quantity, orderId) trong 1 query nhỏ duy nhất
    const existing = await db.orderItem.findUniqueOrThrow({
      where: { id },
      select: { price: true, quantity: true, orderId: true },
    })
    const newPrice = data.price !== undefined ? data.price : Number(existing.price)
    const newQty = data.quantity !== undefined ? data.quantity : existing.quantity
    return db.orderItem.update({
      where: { id },
      data: {
        ...(data.price !== undefined && { price: new Prisma.Decimal(data.price) }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        totalPrice: new Prisma.Decimal(newPrice * newQty),
        ...(data.eventDate !== undefined && { eventDate: data.eventDate ?? null }),
        ...(data.deadline !== undefined && { deadline: data.deadline ?? null }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId || null }),
      },
      select: { ...orderItemSummarySelect, orderId: true },
    })
  },

  async delete(id: string): Promise<{ orderId: string }> {
    const item = await db.orderItem.findUniqueOrThrow({
      where: { id },
      select: { orderId: true },
    })
    await db.orderItem.delete({ where: { id } })
    return { orderId: item.orderId }
  },

  async assignStaff(id: string, assignedToId: string | null): Promise<void> {
    await db.orderItem.update({
      where: { id },
      data: { assignedToId: assignedToId || null },
    })
  },

  async updateDeliveryStatus(
    id: string,
    deliveryStatus: "PENDING" | "DELIVERED",
  ): Promise<{ orderId: string }> {
    const item = await db.orderItem.update({
      where: { id },
      data: {
        deliveryStatus,
        fileDeliveredAt: deliveryStatus === "DELIVERED" ? new Date() : null,
      },
      select: { orderId: true },
    })
    return { orderId: item.orderId }
  },
}

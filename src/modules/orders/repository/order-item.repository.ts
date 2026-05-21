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
    initialStepId: string | null,
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
        ...(initialStepId && { currentStepId: initialStepId }),
      },
      select: orderItemSummarySelect,
    })
  },

  async update(id: string, data: UpdateOrderItemDto): Promise<OrderItemSummary> {
    const { price, quantity, eventDate, deadline, notes, assignedToId } = data
    const existing = await db.orderItem.findUniqueOrThrow({
      where: { id },
      select: { price: true, quantity: true },
    })
    const newPrice = price !== undefined ? price : Number(existing.price)
    const newQty = quantity !== undefined ? quantity : existing.quantity
    return db.orderItem.update({
      where: { id },
      data: {
        ...(price !== undefined && { price: new Prisma.Decimal(price) }),
        ...(quantity !== undefined && { quantity }),
        totalPrice: new Prisma.Decimal(newPrice * newQty),
        ...(eventDate !== undefined && { eventDate: eventDate ?? null }),
        ...(deadline !== undefined && { deadline: deadline ?? null }),
        ...(notes !== undefined && { notes }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      },
      select: orderItemSummarySelect,
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

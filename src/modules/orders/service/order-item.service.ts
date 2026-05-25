import { orderItemRepository } from "../repository/order-item.repository"
import { orderRepository } from "../repository/order.repository"
import { orderService } from "./order.service"
import type { AddOrderItemDto, OrderItemSummary, UpdateOrderItemDto } from "../types/orders.types"

/** Chuyển Prisma P2025 (Record not found) thành lỗi nghiệp vụ */
function rethrowNotFound(err: unknown, message: string): never {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  ) {
    throw new Error(message)
  }
  throw err
}

export const orderItemService = {
  async add(data: AddOrderItemDto): Promise<OrderItemSummary> {
    const { db } = await import("@/shared/lib/prisma")
    const definition = await db.serviceDefinition.findUnique({
      where: { id: data.serviceDefinitionId },
      select: { name: true },
    })
    if (!definition) throw new Error("SERVICE_DEFINITION_NOT_FOUND")

    const item = await orderItemRepository.createWithName(data, definition.name)

    await orderRepository.recalculateTotals(data.orderId)
    await orderService.computeAndUpdateOrderStatus(data.orderId)
    return item
  },

  async update(id: string, data: UpdateOrderItemDto): Promise<OrderItemSummary> {
    try {
      const updated = await orderItemRepository.update(id, data)
      await orderRepository.recalculateTotals(updated.orderId)
      await orderService.computeAndUpdateOrderStatus(updated.orderId)
      const { orderId: _orderId, ...itemData } = updated
      return itemData as OrderItemSummary
    } catch (err) {
      rethrowNotFound(err, "ORDER_ITEM_NOT_FOUND")
    }
  },

  async remove(id: string): Promise<void> {
    const { orderId } = await orderItemRepository.delete(id)
    await orderRepository.recalculateTotals(orderId)
    await orderService.computeAndUpdateOrderStatus(orderId)
  },

  async assignStaff(id: string, assignedToId: string | null): Promise<void> {
    try {
      await orderItemRepository.assignStaff(id, assignedToId)
    } catch (err) {
      rethrowNotFound(err, "ORDER_ITEM_NOT_FOUND")
    }
  },

  async updateDeliveryStatus(
    id: string,
    deliveryStatus: "PENDING" | "DELIVERED",
  ): Promise<void> {
    try {
      const { orderId } = await orderItemRepository.updateDeliveryStatus(id, deliveryStatus)
      await orderService.computeAndUpdateOrderStatus(orderId)
    } catch (err) {
      rethrowNotFound(err, "ORDER_ITEM_NOT_FOUND")
    }
  },
}

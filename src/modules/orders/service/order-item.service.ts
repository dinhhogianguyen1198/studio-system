import { db } from "@/shared/lib/prisma"
import { Prisma } from "@prisma/client"
import { orderItemRepository } from "../repository/order-item.repository"
import { orderRepository } from "../repository/order.repository"
import { orderService } from "./order.service"
import type { AddOrderItemDto, OrderItemSummary, UpdateOrderItemDto } from "../types/orders.types"

export const orderItemService = {
  async add(data: AddOrderItemDto): Promise<OrderItemSummary> {
    const definition = await db.serviceDefinition.findUnique({
      where: { id: data.serviceDefinitionId },
      select: {
        name: true,
        workflowTemplate: {
          select: {
            steps: {
              select: { id: true, key: true, name: true },
              orderBy: { sortOrder: "asc" },
              take: 1,
            },
          },
        },
      },
    })
    if (!definition) throw new Error("SERVICE_DEFINITION_NOT_FOUND")

    const initialStep = definition.workflowTemplate?.steps[0] ?? null
    const item = await orderItemRepository.createWithName(data, definition.name, initialStep?.id ?? null)

    if (initialStep) {
      const order = await db.order.findUnique({
        where: { id: data.orderId },
        select: { createdById: true },
      })
      await db.orderItemWorkflowLog.create({
        data: {
          orderItemId: item.id,
          fromStepId: null,
          toStepKey: initialStep.key,
          toStepName: initialStep.name,
          note: "Khởi tạo dịch vụ",
          changedById: order?.createdById ?? "",
        },
      })
    }

    await orderRepository.recalculateTotals(data.orderId)
    await orderService.computeAndUpdateOrderStatus(data.orderId)
    return item
  },

  async update(id: string, data: UpdateOrderItemDto): Promise<OrderItemSummary> {
    const item = await orderItemRepository.findById(id)
    if (!item) throw new Error("ORDER_ITEM_NOT_FOUND")
    const updated = await orderItemRepository.update(id, data)
    const fullItem = await db.orderItem.findUniqueOrThrow({
      where: { id },
      select: { orderId: true },
    })
    await orderRepository.recalculateTotals(fullItem.orderId)
    await orderService.computeAndUpdateOrderStatus(fullItem.orderId)
    return updated
  },

  async remove(id: string): Promise<void> {
    const { orderId } = await orderItemRepository.delete(id)
    await orderRepository.recalculateTotals(orderId)
    await orderService.computeAndUpdateOrderStatus(orderId)
  },

  async assignStaff(id: string, assignedToId: string | null): Promise<void> {
    const item = await orderItemRepository.findById(id)
    if (!item) throw new Error("ORDER_ITEM_NOT_FOUND")
    await orderItemRepository.assignStaff(id, assignedToId)
  },

  async updateDeliveryStatus(
    id: string,
    deliveryStatus: "PENDING" | "DELIVERED",
  ): Promise<void> {
    const item = await orderItemRepository.findById(id)
    if (!item) throw new Error("ORDER_ITEM_NOT_FOUND")
    const { orderId } = await orderItemRepository.updateDeliveryStatus(id, deliveryStatus)
    await orderService.computeAndUpdateOrderStatus(orderId)
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
        type: data.type as never,
        amount: new Prisma.Decimal(data.amount),
        method: data.method as never,
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

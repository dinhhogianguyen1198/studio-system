import { db } from "@/shared/lib/prisma"
import { Prisma } from "@prisma/client"
import { productionRepository } from "../repository/production.repository"
import {
  serializeKanbanOrder,
  serializeCalendarOrder,
  KANBAN_COLUMNS,
  type KanbanColumnMeta,
  type KanbanTransitionType,
  type ProductionKanbanFilters,
  type ProductionCalendarFilters,
  type CalendarOrderEvent,
} from "../types/production.types"
import { orderService } from "@/modules/orders/service/order.service"

export const productionService = {
  async getKanbanColumns(
    filters: ProductionKanbanFilters,
  ): Promise<KanbanColumnMeta[]> {
    const rawOrders = await productionRepository.getKanbanOrders(filters)
    const orders = rawOrders.map(serializeKanbanOrder)

    const columnMap = new Map<string, KanbanColumnMeta>()
    for (const col of KANBAN_COLUMNS) {
      columnMap.set(col.status, { ...col, count: 0, orders: [] })
    }

    for (const order of orders) {
      const col = columnMap.get(order.status)
      if (col) {
        col.orders.push(order)
        col.count++
      }
    }

    return Array.from(columnMap.values())
  },

  async getCalendarEvents(
    filters: ProductionCalendarFilters,
  ): Promise<CalendarOrderEvent[]> {
    const rawOrders = await productionRepository.getCalendarOrders(filters)
    const events = rawOrders
      .map(serializeCalendarOrder)
      .filter((e): e is CalendarOrderEvent => e != null)
    return events
  },

  async getOrderManagementUnits() {
    return productionRepository.getOrderManagementUnits()
  },

  async executeTransition(
    orderId: string,
    transitionType: KanbanTransitionType,
    actorId: string,
  ): Promise<{ newStatus: string }> {
    const order = await productionRepository.getOrderWithItems(orderId)
    if (!order) throw new Error("ORDER_NOT_FOUND")

    switch (transitionType) {
      case "MARK_ALL_DELIVERED": {
        const pendingItems = order.items.filter((i) => i.deliveryStatus === "PENDING")
        if (pendingItems.length === 0) {
          // All already delivered — recompute only
          await orderService.computeAndUpdateOrderStatus(orderId)
          break
        }
        await db.$transaction(
          pendingItems.map((item) =>
            db.orderItem.update({
              where: { id: item.id },
              data: {
                deliveryStatus: "DELIVERED",
                fileDeliveredAt: new Date(),
              },
            }),
          ),
        )
        await orderService.computeAndUpdateOrderStatus(orderId)
        break
      }

      case "CONFIRM_COMPLETED": {
        // Recompute — if all delivered + fully paid → COMPLETED
        await orderService.computeAndUpdateOrderStatus(orderId)
        break
      }

      default:
        throw new Error("INVALID_TRANSITION")
    }

    const updated = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true },
    })
    return { newStatus: updated.status }
  },
}

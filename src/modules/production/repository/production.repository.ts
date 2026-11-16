import { db } from "@/shared/lib/prisma"
import { Prisma } from "@prisma/client/edge"
import {
  kanbanOrderSelect,
  calendarOrderSelect,
  type ProductionKanbanFilters,
  type ProductionCalendarFilters,
} from "../types/production.types"

export const productionRepository = {
  async getKanbanOrders(filters: ProductionKanbanFilters) {
    const { search, orderManagementUnitId, includeCompleted = false } = filters

    const where: Prisma.OrderWhereInput = {
      ...(!includeCompleted && {
        status: { not: "COMPLETED" },
      }),
      ...(orderManagementUnitId && { orderManagementUnitId }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search } },
          { contactName: { contains: search } },
          { partyName: { contains: search } },
          { customer: { name: { contains: search } } },
        ],
      }),
    }

    return db.order.findMany({
      where,
      select: kanbanOrderSelect,
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
      take: 500,
    })
  },

  async getCalendarOrders(filters: ProductionCalendarFilters) {
    const { start, end, orderManagementUnitId } = filters

    const where: Prisma.OrderWhereInput = {
      ...(orderManagementUnitId && { orderManagementUnitId }),
      items: {
        some: {
          OR: [
            { eventDate: { gte: start, lte: end } },
            { deadline: { gte: start, lte: end } },
          ],
        },
      },
    }

    return db.order.findMany({
      where,
      select: calendarOrderSelect,
      orderBy: { createdAt: "desc" },
      take: 300,
    })
  },

  async getOrderManagementUnits() {
    return db.orderManagementUnit.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    })
  },

  async getOrderWithItems(id: string) {
    return db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
        items: {
          select: {
            id: true,
            deliveryStatus: true,
            deadline: true,
            eventDate: true,
          },
        },
      },
    })
  },
}

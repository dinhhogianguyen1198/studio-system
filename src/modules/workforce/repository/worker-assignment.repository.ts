import { Prisma } from "@prisma/client"
import { db } from "@/shared/lib/prisma"
import {
  orderItemWorkerSelect,
  type OrderItemWorkerDetail,
  type PayrollFilters,
} from "@/modules/workforce/types/workforce.types"

export const workerAssignmentRepository = {
  async findByOrderItem(orderItemId: string): Promise<OrderItemWorkerDetail[]> {
    return db.orderItemWorker.findMany({
      where: { orderItemId },
      select: orderItemWorkerSelect,
      orderBy: { createdAt: "asc" },
    })
  },

  async findById(id: string): Promise<OrderItemWorkerDetail | null> {
    return db.orderItemWorker.findUnique({
      where: { id },
      select: orderItemWorkerSelect,
    })
  },

  async findMany(filters: PayrollFilters): Promise<OrderItemWorkerDetail[]> {
    const where: Prisma.OrderItemWorkerWhereInput = {
      ...(filters.orderItemId && { orderItemId: filters.orderItemId }),
      ...(filters.workerId && { workerId: filters.workerId }),
      ...(filters.jobTypeId && { jobTypeId: filters.jobTypeId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom && { gte: filters.dateFrom }),
              ...(filters.dateTo && { lte: filters.dateTo }),
            },
          }
        : {}),
    }

    return db.orderItemWorker.findMany({
      where,
      select: orderItemWorkerSelect,
      orderBy: { createdAt: "desc" },
      take: 500,
    })
  },

  async existsAssignment(orderItemId: string, workerId: string, jobTypeId: string): Promise<boolean> {
    const count = await db.orderItemWorker.count({
      where: { orderItemId, workerId, jobTypeId },
    })
    return count > 0
  },

  async create(data: {
    orderItemId: string
    workerId: string
    jobTypeId: string
    workerNameSnapshot: string
    jobTypeNameSnapshot: string
    rateTypeSnapshot: string
    rateAmountSnapshot: Prisma.Decimal
    quantity: Prisma.Decimal
    totalCost: Prisma.Decimal
    notes?: string | null
    assignedById: string
  }): Promise<OrderItemWorkerDetail> {
    return db.orderItemWorker.create({
      data: data as Parameters<typeof db.orderItemWorker.create>[0]["data"],
      select: orderItemWorkerSelect,
    })
  },

  async updateStatus(
    id: string,
    status: string,
    notes?: string | null,
    startedAt?: Date | null,
    completedAt?: Date | null,
  ): Promise<OrderItemWorkerDetail> {
    return db.orderItemWorker.update({
      where: { id },
      data: {
        status: status as Parameters<typeof db.orderItemWorker.update>[0]["data"]["status"],
        ...(notes !== undefined && { notes }),
        ...(startedAt !== undefined && { startedAt }),
        ...(completedAt !== undefined && { completedAt }),
      },
      select: orderItemWorkerSelect,
    })
  },

  async delete(id: string): Promise<void> {
    await db.orderItemWorker.delete({ where: { id } })
  },

  async getServiceCostSummary(orderItemId: string): Promise<{ totalCost: number; workerCount: number }> {
    const result = await db.orderItemWorker.aggregate({
      where: { orderItemId, status: { not: "CANCELLED" } },
      _sum: { totalCost: true },
      _count: { id: true },
    })
    return {
      totalCost: Number(result._sum.totalCost ?? 0),
      workerCount: result._count.id,
    }
  },

  async getOrderCostSummary(orderId: string): Promise<number> {
    const result = await db.orderItemWorker.aggregate({
      where: {
        orderItem: { orderId },
        status: { not: "CANCELLED" },
      },
      _sum: { totalCost: true },
    })
    return Number(result._sum.totalCost ?? 0)
  },

  async findEffectiveRate(
    workerId: string,
    jobTypeId: string,
    serviceDefinitionId?: string | null,
  ): Promise<{ rateType: string; amount: Prisma.Decimal } | null> {
    // Prefer service-specific rate over generic rate
    const now = new Date()
    const baseWhere = {
      workerId,
      jobTypeId,
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    }

    if (serviceDefinitionId) {
      const specific = await db.workerRate.findFirst({
        where: { ...baseWhere, serviceDefinitionId },
        select: { rateType: true, amount: true },
        orderBy: { effectiveFrom: "desc" },
      })
      if (specific) return specific
    }

    // Fall back to generic rate (no service definition)
    return db.workerRate.findFirst({
      where: { ...baseWhere, serviceDefinitionId: null },
      select: { rateType: true, amount: true },
      orderBy: { effectiveFrom: "desc" },
    })
  },
}

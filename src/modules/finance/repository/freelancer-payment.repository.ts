import { Prisma } from "@prisma/client"
import { db } from "@/shared/lib/prisma"
import type { FreelancerPaymentFilters } from "../schemas/finance.schema"
import {
  freelancerPaymentSummarySelect,
  freelancerPaymentDetailSelect,
  type FreelancerPaymentSummary,
  type FreelancerPaymentDetail,
} from "../types/finance.types"
import type { PaginatedResult } from "@/shared/types/api.types"

export const freelancerPaymentRepository = {
  async findMany(
    filters: FreelancerPaymentFilters,
  ): Promise<PaginatedResult<FreelancerPaymentSummary>> {
    const { page, pageSize, workerId, status, from, to } = filters

    const where: Prisma.FreelancerPaymentWhereInput = {
      ...(workerId && { workerId }),
      ...(status && { status }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    }

    const [data, total] = await Promise.all([
      db.freelancerPayment.findMany({
        where,
        select: freelancerPaymentSummarySelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.freelancerPayment.count({ where }),
    ])

    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } }
  },

  async findById(id: string): Promise<FreelancerPaymentDetail | null> {
    return db.freelancerPayment.findUnique({
      where: { id },
      select: freelancerPaymentDetailSelect,
    })
  },

  async create(data: {
    workerId: string
    periodStart: Date
    periodEnd: Date
    totalAmount: Prisma.Decimal
    notes?: string
    createdById: string
    items: Array<{ orderItemWorkerId: string; amount: Prisma.Decimal }>
  }): Promise<FreelancerPaymentDetail> {
    const { items, ...paymentData } = data
    return db.freelancerPayment.create({
      data: {
        ...paymentData,
        items: { create: items },
      },
      select: freelancerPaymentDetailSelect,
    })
  },

  async markPaid(
    id: string,
    data: {
      paymentMethod: string
      reference?: string
      paidAt: Date
      paidById: string
      notes?: string
    },
  ): Promise<FreelancerPaymentDetail> {
    return db.$transaction(async (tx) => {
      const payment = await tx.freelancerPayment.update({
        where: { id },
        data: {
          status: "PAID",
          paymentMethod: data.paymentMethod as Prisma.EnumPaymentMethodFilter["equals"],
          reference: data.reference,
          paidAt: data.paidAt,
          paidById: data.paidById,
          notes: data.notes,
        },
        select: { id: true, items: { select: { orderItemWorkerId: true } } },
      })

      await tx.orderItemWorker.updateMany({
        where: { id: { in: payment.items.map((i) => i.orderItemWorkerId) } },
        data: { paidAt: data.paidAt },
      })

      return tx.freelancerPayment.findUniqueOrThrow({
        where: { id },
        select: freelancerPaymentDetailSelect,
      })
    })
  },

  async cancel(id: string): Promise<void> {
    await db.freelancerPayment.update({
      where: { id },
      data: { status: "CANCELLED" },
    })
  },

  // ─── Unpaid assignments ───────────────────────────────────────────────────

  async findUnpaidAssignments(workerId: string) {
    return db.orderItemWorker.findMany({
      where: {
        workerId,
        status: "COMPLETED",
        paidAt: null,
        freelancerPaymentItem: null,
      },
      select: {
        id: true,
        workerNameSnapshot: true,
        jobTypeNameSnapshot: true,
        rateTypeSnapshot: true,
        rateAmountSnapshot: true,
        quantity: true,
        totalCost: true,
        completedAt: true,
        orderItem: {
          select: {
            id: true,
            name: true,
            order: { select: { id: true, orderNumber: true } },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    })
  },

  async sumPendingByWorker(): Promise<{ workerId: string; total: number }[]> {
    const rows = await db.orderItemWorker.groupBy({
      by: ["workerId"],
      where: { status: "COMPLETED", paidAt: null, freelancerPaymentItem: null },
      _sum: { totalCost: true },
    })
    return rows.map((r) => ({
      workerId: r.workerId,
      total: r._sum.totalCost?.toNumber() ?? 0,
    }))
  },

  async countUnpaidWorkers(): Promise<number> {
    const result = await db.orderItemWorker.findMany({
      where: { status: "COMPLETED", paidAt: null, freelancerPaymentItem: null },
      distinct: ["workerId"],
      select: { workerId: true },
    })
    return result.length
  },
}

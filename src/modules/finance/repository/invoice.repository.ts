import { atomicBatch, insertRow, createId } from "@/shared/lib/d1"
import { Prisma } from "@prisma/client/edge"
import { db } from "@/shared/lib/prisma"
import type { InvoiceFilters } from "../schemas/finance.schema"
import {
  invoiceSummarySelect,
  invoiceDetailSelect,
  type InvoiceSummary,
  type InvoiceDetail,
} from "../types/finance.types"
import type { PaginatedResult } from "@/shared/types/api.types"

export const invoiceRepository = {
  async findMany(filters: InvoiceFilters): Promise<PaginatedResult<InvoiceSummary>> {
    const { page, pageSize, search, status, customerId, from, to } = filters

    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search } },
          { customer: { name: { contains: search } } },
          { order: { orderNumber: { contains: search } } },
        ],
      }),
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...((from || to) && {
        issueDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    }

    const [data, total] = await Promise.all([
      db.invoice.findMany({
        where,
        select: invoiceSummarySelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.invoice.count({ where }),
    ])

    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } }
  },

  async findById(id: string): Promise<InvoiceDetail | null> {
    return db.invoice.findFirst({
      where: { id, deletedAt: null },
      select: invoiceDetailSelect,
    })
  },

  async findByOrderId(orderId: string): Promise<InvoiceDetail | null> {
    return db.invoice.findFirst({
      where: { orderId, deletedAt: null },
      select: invoiceDetailSelect,
    })
  },

  async create(data: {
    invoiceNumber: string
    orderId?: string
    customerId?: string
    dueDate: Date
    subtotal: Prisma.Decimal
    discountAmount: Prisma.Decimal
    taxAmount: Prisma.Decimal
    totalAmount: Prisma.Decimal
    notes?: string
    terms?: string
    createdById: string
    items: Array<{
      description: string
      quantity: Prisma.Decimal
      unitPrice: Prisma.Decimal
      totalPrice: Prisma.Decimal
      sortOrder: number
    }>
  }): Promise<InvoiceDetail> {
    const { items, ...invoiceData } = data
    const id = createId()
    const now = new Date()
    await atomicBatch([
      insertRow("invoices", { id, ...invoiceData, issueDate: now, createdAt: now, updatedAt: now }),
      ...items.map((item) => insertRow("invoice_items", { id: createId(), invoiceId: id, ...item })),
    ])
    return db.invoice.findUniqueOrThrow({ where: { id }, select: invoiceDetailSelect })
  },

  async update(id: string, data: Prisma.InvoiceUpdateInput): Promise<InvoiceDetail> {
    return db.invoice.update({
      where: { id },
      data,
      select: invoiceDetailSelect,
    })
  },

  async replaceItems(
    invoiceId: string,
    items: Array<{
      description: string
      quantity: Prisma.Decimal
      unitPrice: Prisma.Decimal
      totalPrice: Prisma.Decimal
      sortOrder: number
    }>,
  ): Promise<void> {
    await atomicBatch([
      { sql: 'DELETE FROM invoice_items WHERE "invoiceId" = ?', values: [invoiceId] },
      ...items.map((item) => insertRow("invoice_items", { id: createId(), invoiceId, ...item })),
    ])
  },

  async softDelete(id: string): Promise<void> {
    await db.invoice.update({ where: { id }, data: { deletedAt: new Date() } })
  },

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const rows = await db.$queryRaw<{ value: number }[]>`
      INSERT INTO number_sequences (name, value) VALUES (${`INV-${year}`}, 1)
      ON CONFLICT(name) DO UPDATE SET value = value + 1 RETURNING value
    `
    return `INV-${year}-${String(rows[0].value).padStart(4, "0")}`
  },

  // ─── Aggregations for reports ─────────────────────────────────────────────

  async sumPaidByMonth(from: Date, to: Date): Promise<{ month: string; total: number }[]> {
    const rows = await db.$queryRaw<{ month: string; total: string }[]>`
      SELECT
        strftime('%Y-%m', "issueDate") AS month,
        SUM("totalAmount") AS total
      FROM invoices
      WHERE "deletedAt" IS NULL
        AND status IN ('PAID', 'PARTIAL')
        AND "issueDate" >= ${from}
        AND "issueDate" <= ${to}
      GROUP BY month
      ORDER BY month
    `
    return rows.map((r) => ({ month: r.month, total: parseFloat(r.total) }))
  },

  async countOverdue(): Promise<number> {
    return db.invoice.count({
      where: {
        deletedAt: null,
        status: { in: ["SENT", "PARTIAL"] },
        dueDate: { lt: new Date() },
      },
    })
  },

  async sumOutstandingReceivables(): Promise<number> {
    const result = await db.invoice.aggregate({
      where: {
        deletedAt: null,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
      },
      _sum: { totalAmount: true, paidAmount: true },
    })
    const total = result._sum.totalAmount?.toNumber() ?? 0
    const paid = result._sum.paidAmount?.toNumber() ?? 0
    return total - paid
  },
}

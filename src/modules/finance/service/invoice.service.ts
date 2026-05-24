import { Prisma } from "@prisma/client"
import { invoiceRepository } from "../repository/invoice.repository"
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
} from "../schemas/finance.schema"
import type { InvoiceSummary, InvoiceDetail } from "../types/finance.types"
import type { PaginatedResult } from "@/shared/types/api.types"

export const invoiceService = {
  async list(filters: InvoiceFilters): Promise<PaginatedResult<InvoiceSummary>> {
    return invoiceRepository.findMany(filters)
  },

  async getById(id: string): Promise<InvoiceDetail> {
    const invoice = await invoiceRepository.findById(id)
    if (!invoice) throw new Error("NOT_FOUND")
    return invoice
  },

  async getByOrderId(orderId: string): Promise<InvoiceDetail | null> {
    return invoiceRepository.findByOrderId(orderId)
  },

  async create(data: CreateInvoiceInput, createdById: string): Promise<InvoiceDetail> {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const discountAmount = data.discountAmount ?? 0
    const taxAmount = data.taxAmount ?? 0
    const totalAmount = subtotal - discountAmount + taxAmount

    const invoiceNumber = await invoiceRepository.generateInvoiceNumber()

    return invoiceRepository.create({
      invoiceNumber,
      orderId: data.orderId,
      customerId: data.customerId,
      dueDate: new Date(data.dueDate),
      subtotal: new Prisma.Decimal(subtotal),
      discountAmount: new Prisma.Decimal(discountAmount),
      taxAmount: new Prisma.Decimal(taxAmount),
      totalAmount: new Prisma.Decimal(totalAmount),
      notes: data.notes,
      terms: data.terms,
      createdById,
      items: data.items.map((item, i) => ({
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unitPrice: new Prisma.Decimal(item.unitPrice),
        totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
        sortOrder: item.sortOrder ?? i,
      })),
    })
  },

  async update(data: UpdateInvoiceInput): Promise<InvoiceDetail> {
    const existing = await invoiceRepository.findById(data.id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status === "PAID" || existing.status === "CANCELLED") {
      throw new Error("CANNOT_EDIT_FINALIZED_INVOICE")
    }

    let recalcFields: Partial<{
      subtotal: Prisma.Decimal
      discountAmount: Prisma.Decimal
      taxAmount: Prisma.Decimal
      totalAmount: Prisma.Decimal
    }> = {}

    if (data.items) {
      const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      const discountAmount = data.discountAmount ?? existing.discountAmount.toNumber()
      const taxAmount = data.taxAmount ?? existing.taxAmount.toNumber()
      recalcFields = {
        subtotal: new Prisma.Decimal(subtotal),
        discountAmount: new Prisma.Decimal(discountAmount),
        taxAmount: new Prisma.Decimal(taxAmount),
        totalAmount: new Prisma.Decimal(subtotal - discountAmount + taxAmount),
      }

      await invoiceRepository.replaceItems(
        data.id,
        data.items.map((item, i) => ({
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
          sortOrder: item.sortOrder ?? i,
        })),
      )
    }

    return invoiceRepository.update(data.id, {
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.terms !== undefined && { terms: data.terms }),
      ...recalcFields,
    })
  },

  async send(id: string): Promise<InvoiceDetail> {
    const existing = await invoiceRepository.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status !== "DRAFT") throw new Error("INVOICE_NOT_DRAFT")

    return invoiceRepository.update(id, {
      status: "SENT",
      sentAt: new Date(),
    })
  },

  async cancel(id: string): Promise<InvoiceDetail> {
    const existing = await invoiceRepository.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status === "PAID") throw new Error("CANNOT_CANCEL_PAID_INVOICE")

    return invoiceRepository.update(id, {
      status: "CANCELLED",
      cancelledAt: new Date(),
    })
  },

  async delete(id: string): Promise<void> {
    const existing = await invoiceRepository.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status === "PAID") throw new Error("CANNOT_DELETE_PAID_INVOICE")
    await invoiceRepository.softDelete(id)
  },

  async syncOverdueStatuses(): Promise<number> {
    const { count } = await import("@/shared/lib/prisma").then(({ db }) =>
      db.invoice.updateMany({
        where: {
          deletedAt: null,
          status: { in: ["SENT", "PARTIAL"] },
          dueDate: { lt: new Date() },
        },
        data: { status: "OVERDUE" },
      }),
    )
    return count
  },
}

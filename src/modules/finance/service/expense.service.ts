import { Prisma } from "@prisma/client"
import { expenseRepository } from "../repository/expense.repository"
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilters,
} from "../schemas/finance.schema"
import type { ExpenseSummary, ExpenseCategorySummary } from "../types/finance.types"
import type { PaginatedResult } from "@/shared/types/api.types"

export const expenseService = {
  async list(filters: ExpenseFilters): Promise<PaginatedResult<ExpenseSummary>> {
    return expenseRepository.findMany(filters)
  },

  async getById(id: string): Promise<ExpenseSummary> {
    const expense = await expenseRepository.findById(id)
    if (!expense) throw new Error("NOT_FOUND")
    return expense
  },

  async create(data: CreateExpenseInput, createdById: string): Promise<ExpenseSummary> {
    return expenseRepository.create({
      title: data.title,
      amount: new Prisma.Decimal(data.amount),
      currency: "VND",
      category: { connect: { id: data.categoryId } },
      ...(data.orderId && { order: { connect: { id: data.orderId } } }),
      expenseDate: new Date(data.expenseDate),
      paymentMethod: data.paymentMethod as Prisma.EnumPaymentMethodFilter["equals"],
      reference: data.reference,
      notes: data.notes,
      createdBy: { connect: { id: createdById } },
    })
  },

  async update(data: UpdateExpenseInput, updatedById: string): Promise<ExpenseSummary> {
    const existing = await expenseRepository.findById(data.id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status === "PAID" || existing.status === "CANCELLED") {
      throw new Error("CANNOT_EDIT_FINALIZED_EXPENSE")
    }

    return expenseRepository.update(data.id, {
      ...(data.title && { title: data.title }),
      ...(data.amount !== undefined && { amount: new Prisma.Decimal(data.amount) }),
      ...(data.categoryId && { category: { connect: { id: data.categoryId } } }),
      ...(data.orderId !== undefined && {
        order: data.orderId ? { connect: { id: data.orderId } } : { disconnect: true },
      }),
      ...(data.expenseDate && { expenseDate: new Date(data.expenseDate) }),
      ...(data.paymentMethod !== undefined && {
        paymentMethod: data.paymentMethod as Prisma.EnumPaymentMethodFilter["equals"],
      }),
      ...(data.reference !== undefined && { reference: data.reference }),
      ...(data.notes !== undefined && { notes: data.notes }),
      updatedBy: { connect: { id: updatedById } },
    })
  },

  async approve(id: string, approverId: string): Promise<ExpenseSummary> {
    const existing = await expenseRepository.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status !== "PENDING") throw new Error("EXPENSE_NOT_PENDING")

    return expenseRepository.update(id, {
      status: "APPROVED",
      approvedBy: { connect: { id: approverId } },
      approvedAt: new Date(),
    })
  },

  async reject(id: string, reason?: string): Promise<ExpenseSummary> {
    const existing = await expenseRepository.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status !== "PENDING") throw new Error("EXPENSE_NOT_PENDING")

    return expenseRepository.update(id, {
      status: "REJECTED",
      ...(reason && { notes: reason }),
    })
  },

  async markPaid(
    id: string,
    paymentMethod: string,
    reference?: string,
  ): Promise<ExpenseSummary> {
    const existing = await expenseRepository.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status !== "APPROVED") throw new Error("EXPENSE_NOT_APPROVED")

    return expenseRepository.update(id, {
      status: "PAID",
      paymentMethod: paymentMethod as Prisma.EnumPaymentMethodFilter["equals"],
      ...(reference && { reference }),
    })
  },

  async delete(id: string): Promise<void> {
    const existing = await expenseRepository.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status === "PAID") throw new Error("CANNOT_DELETE_PAID_EXPENSE")
    await expenseRepository.softDelete(id)
  },

  async listCategories(): Promise<ExpenseCategorySummary[]> {
    return expenseRepository.findAllCategoriesFlat()
  },
}

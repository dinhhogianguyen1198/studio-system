import { Prisma } from "@prisma/client"
import { db } from "@/shared/lib/prisma"
import type { ExpenseFilters } from "../schemas/finance.schema"
import {
  expenseSummarySelect,
  expenseCategorySummarySelect,
  type ExpenseSummary,
  type ExpenseCategorySummary,
} from "../types/finance.types"
import type { PaginatedResult } from "@/shared/types/api.types"

export const expenseRepository = {
  async findMany(filters: ExpenseFilters): Promise<PaginatedResult<ExpenseSummary>> {
    const { page, pageSize, search, categoryId, status, orderId, from, to } = filters

    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
      ...(search && { title: { contains: search, mode: "insensitive" } }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...(orderId && { orderId }),
      ...((from || to) && {
        expenseDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    }

    const [data, total] = await Promise.all([
      db.expense.findMany({
        where,
        select: expenseSummarySelect,
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.expense.count({ where }),
    ])

    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } }
  },

  async findById(id: string): Promise<ExpenseSummary | null> {
    return db.expense.findFirst({
      where: { id, deletedAt: null },
      select: expenseSummarySelect,
    })
  },

  async create(
    data: Prisma.ExpenseCreateInput,
  ): Promise<ExpenseSummary> {
    return db.expense.create({
      data,
      select: expenseSummarySelect,
    })
  },

  async update(id: string, data: Prisma.ExpenseUpdateInput): Promise<ExpenseSummary> {
    return db.expense.update({
      where: { id },
      data,
      select: expenseSummarySelect,
    })
  },

  async softDelete(id: string): Promise<void> {
    await db.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  },

  // ─── Category operations ──────────────────────────────────────────────────

  async findAllCategories(): Promise<ExpenseCategorySummary[]> {
    return db.expenseCategory.findMany({
      where: { isActive: true, parentId: null },
      select: expenseCategorySummarySelect,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })
  },

  async findAllCategoriesFlat(): Promise<ExpenseCategorySummary[]> {
    return db.expenseCategory.findMany({
      where: { isActive: true },
      select: expenseCategorySummarySelect,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })
  },

  async createCategory(
    data: Prisma.ExpenseCategoryCreateInput,
  ): Promise<ExpenseCategorySummary> {
    return db.expenseCategory.create({ data, select: expenseCategorySummarySelect })
  },

  // ─── Aggregations ─────────────────────────────────────────────────────────

  async sumByStatus(
    from: Date,
    to: Date,
  ): Promise<{ status: string; amount: number }[]> {
    const rows = await db.$queryRaw<{ status: string; amount: string }[]>`
      SELECT status, COALESCE(SUM(amount), 0)::text AS amount
      FROM expenses
      WHERE deleted_at IS NULL
        AND expense_date >= ${from} AND expense_date <= ${to}
      GROUP BY status
    `
    return rows.map((r) => ({ status: r.status, amount: parseFloat(r.amount) }))
  },

  async sumByCategory(
    from: Date,
    to: Date,
  ): Promise<{ categoryId: string; amount: number }[]> {
    const rows = await db.$queryRaw<{ categoryId: string; amount: string }[]>`
      SELECT category_id AS "categoryId", COALESCE(SUM(amount), 0)::text AS amount
      FROM expenses
      WHERE deleted_at IS NULL AND status = 'PAID'
        AND expense_date >= ${from} AND expense_date <= ${to}
      GROUP BY category_id
    `
    return rows.map((r) => ({ categoryId: r.categoryId, amount: parseFloat(r.amount) }))
  },

  async sumForOrder(orderId: string): Promise<Prisma.Decimal> {
    const result = await db.expense.aggregate({
      where: { orderId, deletedAt: null, status: "PAID" },
      _sum: { amount: true },
    })
    return result._sum.amount ?? new Prisma.Decimal(0)
  },
}

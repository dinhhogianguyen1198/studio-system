import { db } from "@/shared/lib/prisma"
import type {
  FinancialKpi,
  RevenueExpenseDataPoint,
  OrderProfitReport,
  TopServiceProfit,
  ExpenseBreakdown,
} from "../types/finance.types"

export const financeReportRepository = {
  async getKpi(from: Date, to: Date): Promise<FinancialKpi> {
    const [revenueResult, expenseResult, workerCostResult, invoiceMetrics, pendingPayables, unpaidWorkers] =
      await Promise.all([
        // Revenue from completed order payments in period
        db.orderPayment.aggregate({
          where: {
            paidAt: { gte: from, lte: to },
            type: { not: "REFUND" },
          },
          _sum: { amount: true },
        }),
        // Paid expenses in period
        db.expense.aggregate({
          where: {
            deletedAt: null,
            status: "PAID",
            expenseDate: { gte: from, lte: to },
          },
          _sum: { amount: true },
        }),
        // Worker costs (completed assignments) in period
        db.orderItemWorker.aggregate({
          where: {
            status: "COMPLETED",
            completedAt: { gte: from, lte: to },
          },
          _sum: { totalCost: true },
        }),
        // Invoice metrics
        Promise.all([
          db.invoice.aggregate({
            where: {
              deletedAt: null,
              status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
            },
            _sum: { totalAmount: true, paidAmount: true },
          }),
          db.invoice.count({
            where: {
              deletedAt: null,
              status: { in: ["SENT", "PARTIAL"] },
              dueDate: { lt: new Date() },
            },
          }),
        ]),
        // Pending payables (approved but not paid expenses)
        db.expense.aggregate({
          where: {
            deletedAt: null,
            status: "APPROVED",
          },
          _sum: { amount: true },
        }),
        // Unpaid workers
        db.orderItemWorker.findMany({
          where: { status: "COMPLETED", paidAt: null, freelancerPaymentItem: null },
          distinct: ["workerId"],
          select: { workerId: true },
        }),
      ])

    const totalRevenue = revenueResult._sum.amount?.toNumber() ?? 0
    const totalExpenses = expenseResult._sum.amount?.toNumber() ?? 0
    const totalWorkerCosts = workerCostResult._sum.totalCost?.toNumber() ?? 0
    const [invoiceAgg, overdueCount] = invoiceMetrics
    const outstandingReceivables =
      (invoiceAgg._sum.totalAmount?.toNumber() ?? 0) -
      (invoiceAgg._sum.paidAmount?.toNumber() ?? 0)
    const grossProfit = totalRevenue - totalWorkerCosts
    const netProfit = grossProfit - totalExpenses

    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      totalWorkerCosts,
      netProfit,
      netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      outstandingReceivables,
      pendingPayables: pendingPayables._sum.amount?.toNumber() ?? 0,
      overdueInvoicesCount: overdueCount,
      unpaidFreelancerCount: unpaidWorkers.length,
    }
  },

  async getRevenueExpenseTrend(
    from: Date,
    to: Date,
    groupBy: "day" | "week" | "month",
  ): Promise<RevenueExpenseDataPoint[]> {
    const dateTrunc = groupBy === "day" ? "day" : groupBy === "week" ? "week" : "month"
    const format = groupBy === "day" ? "YYYY-MM-DD" : groupBy === "week" ? "IYYY-IW" : "YYYY-MM"

    const [revenueRows, expenseRows, workerCostRows] = await Promise.all([
      db.$queryRaw<{ period: string; total: string }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC(${dateTrunc}, "paidAt"), ${format}) AS period,
          SUM(amount)::text AS total
        FROM order_payments
        WHERE type != 'REFUND'
          AND "paidAt" >= ${from} AND "paidAt" <= ${to}
        GROUP BY period ORDER BY period
      `,
      db.$queryRaw<{ period: string; total: string }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC(${dateTrunc}, "expenseDate"), ${format}) AS period,
          SUM(amount)::text AS total
        FROM expenses
        WHERE "deletedAt" IS NULL AND status = 'PAID'
          AND "expenseDate" >= ${from} AND "expenseDate" <= ${to}
        GROUP BY period ORDER BY period
      `,
      db.$queryRaw<{ period: string; total: string }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC(${dateTrunc}, "completedAt"), ${format}) AS period,
          SUM("totalCost")::text AS total
        FROM order_item_workers
        WHERE status = 'COMPLETED'
          AND "completedAt" >= ${from} AND "completedAt" <= ${to}
        GROUP BY period ORDER BY period
      `,
    ])

    const revenueMap = new Map(revenueRows.map((r) => [r.period, parseFloat(r.total)]))
    const expenseMap = new Map(expenseRows.map((r) => [r.period, parseFloat(r.total)]))
    const workerMap = new Map(workerCostRows.map((r) => [r.period, parseFloat(r.total)]))

    const allPeriods = new Set([
      ...revenueMap.keys(),
      ...expenseMap.keys(),
      ...workerMap.keys(),
    ])

    return Array.from(allPeriods)
      .sort()
      .map((period) => {
        const revenue = revenueMap.get(period) ?? 0
        const expenses = expenseMap.get(period) ?? 0
        const workerCosts = workerMap.get(period) ?? 0
        return { period, revenue, expenses, workerCosts, profit: revenue - expenses - workerCosts }
      })
  },

  async getOrderProfitReport(from: Date, to: Date, limit = 20): Promise<OrderProfitReport[]> {
    const rows = await db.$queryRaw<
      {
        orderId: string
        orderNumber: string
        customerName: string
        revenue: string
        workerCosts: string
        directExpenses: string
      }[]
    >`
      SELECT
        o.id AS "orderId",
        o."orderNumber",
        COALESCE(o."contactName", c.name, 'Không có tên') AS "customerName",
        COALESCE(SUM(DISTINCT op.amount) FILTER (WHERE op.type != 'REFUND'), 0)::text AS revenue,
        COALESCE(SUM(DISTINCT oiw."totalCost"), 0)::text AS "workerCosts",
        COALESCE(SUM(DISTINCT e.amount) FILTER (WHERE e.status = 'PAID'), 0)::text AS "directExpenses"
      FROM orders o
      LEFT JOIN customers c ON c.id = o."customerId"
      LEFT JOIN order_payments op ON op."orderId" = o.id AND op."paidAt" >= ${from} AND op."paidAt" <= ${to}
      LEFT JOIN order_items oi ON oi."orderId" = o.id
      LEFT JOIN order_item_workers oiw ON oiw."orderItemId" = oi.id AND oiw.status = 'COMPLETED'
      LEFT JOIN expenses e ON e."orderId" = o.id AND e."deletedAt" IS NULL
      WHERE o."createdAt" >= ${from} AND o."createdAt" <= ${to}
      GROUP BY o.id, o."orderNumber", o."contactName", c.name
      ORDER BY (COALESCE(SUM(DISTINCT op.amount) FILTER (WHERE op.type != 'REFUND'), 0) -
                COALESCE(SUM(DISTINCT oiw."totalCost"), 0) -
                COALESCE(SUM(DISTINCT e.amount) FILTER (WHERE e.status = 'PAID'), 0)) DESC
      LIMIT ${limit}
    `

    return rows.map((r) => {
      const revenue = parseFloat(r.revenue)
      const workerCosts = parseFloat(r.workerCosts)
      const directExpenses = parseFloat(r.directExpenses)
      const grossProfit = revenue - workerCosts - directExpenses
      return {
        orderId: r.orderId,
        orderNumber: r.orderNumber,
        customerName: r.customerName,
        revenue,
        workerCosts,
        directExpenses,
        grossProfit,
        grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      }
    })
  },

  async getTopServices(from: Date, to: Date, limit = 10): Promise<TopServiceProfit[]> {
    const rows = await db.$queryRaw<
      { serviceId: string; serviceName: string; revenue: string; count: string }[]
    >`
      SELECT
        oi."serviceDefinitionId" AS "serviceId",
        sd.name AS "serviceName",
        SUM(oi."totalPrice")::text AS revenue,
        COUNT(oi.id)::text AS count
      FROM order_items oi
      JOIN service_definitions sd ON sd.id = oi."serviceDefinitionId"
      JOIN orders o ON o.id = oi."orderId"
      WHERE o."createdAt" >= ${from} AND o."createdAt" <= ${to}
      GROUP BY oi."serviceDefinitionId", sd.name
      ORDER BY SUM(oi."totalPrice") DESC
      LIMIT ${limit}
    `

    return rows.map((r) => ({
      serviceId: r.serviceId,
      serviceName: r.serviceName,
      revenue: parseFloat(r.revenue),
      count: parseInt(r.count),
      averageRevenue: parseFloat(r.revenue) / parseInt(r.count),
    }))
  },

  async getExpenseBreakdown(from: Date, to: Date): Promise<ExpenseBreakdown[]> {
    const rows = await db.$queryRaw<
      { categoryId: string; categoryName: string; categoryColor: string; total: string }[]
    >`
      SELECT
        ec.id AS "categoryId",
        ec.name AS "categoryName",
        COALESCE(ec.color, '#6B7280') AS "categoryColor",
        SUM(e.amount)::text AS total
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e."categoryId"
      WHERE e."deletedAt" IS NULL
        AND e.status = 'PAID'
        AND e."expenseDate" >= ${from} AND e."expenseDate" <= ${to}
      GROUP BY ec.id, ec.name, ec.color
      ORDER BY SUM(e.amount) DESC
    `

    const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.total), 0)
    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryColor: r.categoryColor,
      total: parseFloat(r.total),
      percentage: grandTotal > 0 ? (parseFloat(r.total) / grandTotal) * 100 : 0,
    }))
  },
}

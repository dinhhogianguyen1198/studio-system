import "server-only"
import { db } from "@/shared/lib/prisma"
import { Prisma } from "@prisma/client"

// ═══════════════════════════════════════════════════════════════
// Dashboard Repository — Studio Production Command Center
// All queries use explicit select, pagination where applicable,
// and Promise.all for independent queries.
// ═══════════════════════════════════════════════════════════════

const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  WAITING_FILES: "Chờ file",
  PARTIAL_DELIVERY: "Giao một phần",
  OVERDUE: "Quá hạn",
  FILES_DELIVERED: "Đã giao file",
  COMPLETED: "Hoàn thành",
}

export const dashboardRepository = {
  // ── KPI: Order Stats ─────────────────────────────────────────
  async getOrderStats(): Promise<{
    currentMonth: number
    lastMonth: number
    today: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [currentMonth, lastMonth, today] = await Promise.all([
      db.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.order.count({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
      }),
      db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    ])

    return { currentMonth, lastMonth, today }
  },

  // ── KPI: Revenue Stats ───────────────────────────────────────
  async getRevenueStats(): Promise<{
    currentMonth: number
    lastMonth: number
    today: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [currentMonth, lastMonth, today] = await Promise.all([
      db.orderPayment.aggregate({
        where: { paidAt: { gte: startOfMonth }, type: { not: "REFUND" } },
        _sum: { amount: true },
      }),
      db.orderPayment.aggregate({
        where: {
          paidAt: { gte: startOfLastMonth, lt: startOfMonth },
          type: { not: "REFUND" },
        },
        _sum: { amount: true },
      }),
      db.orderPayment.aggregate({
        where: { paidAt: { gte: startOfToday }, type: { not: "REFUND" } },
        _sum: { amount: true },
      }),
    ])

    return {
      currentMonth: Number(currentMonth._sum.amount ?? 0),
      lastMonth: Number(lastMonth._sum.amount ?? 0),
      today: Number(today._sum.amount ?? 0),
    }
  },

  // ── KPI: Today Schedule Count ────────────────────────────────
  async getTodayScheduleCount(): Promise<number> {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    return db.orderItem.count({
      where: {
        eventDate: { gte: startOfToday, lt: endOfToday },
        order: { status: { notIn: ["COMPLETED", "OVERDUE"] } },
      },
    })
  },

  // ── KPI: Unpaid Orders ───────────────────────────────────────
  async getUnpaidStats(): Promise<{ count: number; totalAmount: number }> {
    const result = await db.$queryRaw<
      Array<{ count: bigint; total: number | null }>
    >(Prisma.sql`
      SELECT COUNT(*)::bigint AS count,
             COALESCE(SUM("totalAmount" - "paidAmount"), 0)::numeric AS total
      FROM orders
      WHERE "totalAmount" > "paidAmount"
        AND status NOT IN ('COMPLETED', 'OVERDUE')
    `)

    const row = result[0]
    return {
      count: Number(row?.count ?? 0),
      totalAmount: Number(row?.total ?? 0),
    }
  },

  // ── Today's Schedule ─────────────────────────────────────────
  async getTodaySchedules(): Promise<
    Array<{
      id: string
      orderItemId: string
      orderCode: string
      orderTitle: string
      customerName: string | null
      eventDate: Date
      location: string | null
      serviceName: string
      assignedWorkers: Array<{ name: string; jobTypeName: string }>
    }>
  > {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const items = await db.orderItem.findMany({
      where: {
        eventDate: { gte: startOfToday, lt: endOfToday },
        order: { status: { notIn: ["COMPLETED"] } },
      },
      select: {
        id: true,
        name: true,
        eventDate: true,
        location: true,
        serviceDefinition: { select: { name: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            contactName: true,
            customer: { select: { name: true } },
          },
        },
        workerAssignments: {
          select: {
            workerNameSnapshot: true,
            jobTypeNameSnapshot: true,
          },
        },
      },
      orderBy: { eventDate: "asc" },
      take: 20,
    })

    return items.map((item) => ({
      id: item.order.id,
      orderItemId: item.id,
      orderCode: item.order.orderNumber,
      orderTitle: item.name,
      customerName: item.order.customer?.name ?? item.order.contactName,
      eventDate: item.eventDate!,
      location: item.location,
      serviceName: item.serviceDefinition.name,
      assignedWorkers: item.workerAssignments.map((w) => ({
        name: w.workerNameSnapshot,
        jobTypeName: w.jobTypeNameSnapshot,
      })),
    }))
  },

  // ── Workflow Pipeline ────────────────────────────────────────
  async getOrdersByStatus(): Promise<
    Array<{ status: string; label: string; count: number }>
  > {
    const rows = await db.order.groupBy({
      by: ["status"],
      _count: true,
    })

    return rows.map((row) => ({
      status: row.status,
      label: ORDER_STATUS_LABELS[row.status] ?? row.status,
      count: row._count,
    }))
  },

  // ── Upcoming Deadlines ───────────────────────────────────────
  async getUpcomingDeadlines(): Promise<
    Array<{
      id: string
      orderCode: string
      orderTitle: string
      customerName: string | null
      deadline: Date
      status: string
      assignedTo: string | null
    }>
  > {
    const now = new Date()
    const nextTwoWeeks = new Date(now)
    nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14)

    const items = await db.orderItem.findMany({
      where: {
        deadline: { lte: nextTwoWeeks },
        deliveryStatus: "PENDING",
        order: { status: { notIn: ["COMPLETED"] } },
      },
      select: {
        id: true,
        name: true,
        deadline: true,
        assignedTo: { select: { name: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            contactName: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { deadline: "asc" },
      take: 10,
    })

    return items.map((item) => ({
      id: item.id,
      orderId: item.order.id,
      orderCode: item.order.orderNumber,
      orderTitle: item.name,
      customerName: item.order.customer?.name ?? item.order.contactName,
      deadline: item.deadline!,
      status: item.order.status,
      assignedTo: item.assignedTo?.name ?? null,
    }))
  },

  // ── Unpaid Orders by Management Unit ─────────────────────────
  async getUnpaidByUnit(): Promise<
    Array<{
      unitId: string | null
      unitName: string
      count: number
      totalUnpaid: number
    }>
  > {
    const result = await db.$queryRaw<
      Array<{
        unit_id: string | null
        unit_name: string
        count: bigint
        total_unpaid: number
      }>
    >(Prisma.sql`
      SELECT
        o."orderManagementUnitId" AS unit_id,
        COALESCE(u.name, 'Chưa phân loại') AS unit_name,
        COUNT(*)::bigint AS count,
        COALESCE(SUM(o."totalAmount" - o."paidAmount"), 0)::numeric AS total_unpaid
      FROM orders o
      LEFT JOIN order_management_units u ON u.id = o."orderManagementUnitId"
      WHERE o."totalAmount" > o."paidAmount"
        AND o.status NOT IN ('COMPLETED')
      GROUP BY o."orderManagementUnitId", u.name
      ORDER BY total_unpaid DESC
    `)

    return result.map((row) => ({
      unitId: row.unit_id,
      unitName: row.unit_name,
      count: Number(row.count),
      totalUnpaid: Number(row.total_unpaid),
    }))
  },

  // ── Team Workload ────────────────────────────────────────────
  async getTeamWorkload(): Promise<
    Array<{
      workerId: string
      name: string
      avatarUrl: string | null
      activeJobs: number
      completedThisMonth: number
      jobTypes: string[]
    }>
  > {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const workers = await db.worker.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        jobTypes: {
          select: { jobType: { select: { name: true } } },
        },
        assignments: {
          select: {
            status: true,
            completedAt: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 20,
    })

    return workers.map((worker) => {
      const activeJobs = worker.assignments.filter(
        (a) => a.status === "IN_PROGRESS",
      ).length
      const completedThisMonth = worker.assignments.filter(
        (a) =>
          a.status === "COMPLETED" &&
          a.completedAt &&
          a.completedAt >= startOfMonth,
      ).length

      return {
        workerId: worker.id,
        name: worker.name,
        avatarUrl: worker.avatarUrl,
        activeJobs,
        completedThisMonth,
        jobTypes: worker.jobTypes.map((jt) => jt.jobType.name),
      }
    })
  },

  // ── Daily Revenue (Chart) ────────────────────────────────────
  async getDailyRevenue(
    days: number,
  ): Promise<Array<{ date: string; revenue: number; orderCount: number }>> {
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const payments = await db.$queryRaw<
      Array<{ day: Date; revenue: number; order_count: bigint }>
    >(Prisma.sql`
      SELECT
        DATE("paidAt") AS day,
        COALESCE(SUM(amount), 0)::numeric AS revenue,
        COUNT(DISTINCT "orderId")::bigint AS order_count
      FROM order_payments
      WHERE "paidAt" >= ${startDate}
        AND type != 'REFUND'
      GROUP BY DATE("paidAt")
      ORDER BY day ASC
    `)

    // Fill missing days with zero
    const result: Array<{ date: string; revenue: number; orderCount: number }> =
      []
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
      const found = payments.find(
        (p) =>
          new Date(p.day).toDateString() === d.toDateString(),
      )
      result.push({
        date: dateStr,
        revenue: Number(found?.revenue ?? 0),
        orderCount: Number(found?.order_count ?? 0),
      })
    }

    return result
  },

  // ── Alerts ───────────────────────────────────────────────────
  async getAlerts(): Promise<{
    overdueOrders: number
    unpaidOrders: number
    unassignedItems: number
  }> {
    const now = new Date()

    const [overdueOrders, unpaidOrders, unassignedItems] = await Promise.all([
      // Overdue: past deadline items, still pending delivery
      db.orderItem.count({
        where: {
          deadline: { lt: now },
          deliveryStatus: "PENDING",
          order: { status: { notIn: ["COMPLETED"] } },
        },
      }),
      // Unpaid: orders where totalAmount > paidAmount
      db.order.count({
        where: {
          totalAmount: { gt: 0 },
          status: { notIn: ["COMPLETED"] },
          paidAmount: { lt: db.order.fields.totalAmount } as never,
        },
      }).catch(() => {
        // Fallback: use raw count if field comparison not supported
        return db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM orders
          WHERE "totalAmount" > "paidAmount"
            AND "totalAmount" > 0
            AND status NOT IN ('COMPLETED')
        `).then((r) => Number(r[0]?.count ?? 0))
      }),
      // Unassigned: order items with no worker assignments
      db.orderItem.count({
        where: {
          workerAssignments: { none: {} },
          deliveryStatus: "PENDING",
          order: { status: { notIn: ["COMPLETED"] } },
        },
      }),
    ])

    return {
      overdueOrders: typeof overdueOrders === "number" ? overdueOrders : Number(overdueOrders),
      unpaidOrders: typeof unpaidOrders === "number" ? unpaidOrders : Number(unpaidOrders),
      unassignedItems,
    }
  },
}

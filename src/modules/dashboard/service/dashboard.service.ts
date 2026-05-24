import "server-only"
import { dashboardRepository } from "../repository/dashboard.repository"
import type {
  DashboardData,
  KpiStats,
  PipelineItem,
  TodaySchedule,
  UpcomingDeadline,
  DeadlineSeverity,
  WorkerWorkload,
} from "../types/dashboard.types"

// ═══════════════════════════════════════════════════════════════
// Dashboard Service — Business Logic & Aggregation
// Orchestrates repository calls, computes derived metrics.
// ═══════════════════════════════════════════════════════════════

const MAX_WORKER_CAPACITY = 5 // Jobs before considered overloaded

function calcChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100 * 10) / 10
}

function getDeadlineSeverity(deadline: Date): DeadlineSeverity {
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "overdue"
  if (diffDays <= 1) return "urgent"
  if (diffDays <= 3) return "warning"
  return "normal"
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const [
      orderStats,
      revenueStats,
      todayScheduleCount,
      unpaidStats,
      todaySchedulesRaw,
      pipelineRaw,
      deadlinesRaw,
      unpaidByUnit,
      teamRaw,
      revenueChart,
      alertsRaw,
    ] = await Promise.all([
      dashboardRepository.getOrderStats(),
      dashboardRepository.getRevenueStats(),
      dashboardRepository.getTodayScheduleCount(),
      dashboardRepository.getUnpaidStats(),
      dashboardRepository.getTodaySchedules(),
      dashboardRepository.getOrdersByStatus(),
      dashboardRepository.getUpcomingDeadlines(),
      dashboardRepository.getUnpaidByUnit(),
      dashboardRepository.getTeamWorkload(),
      dashboardRepository.getDailyRevenue(30),
      dashboardRepository.getAlerts(),
    ])

    // ── KPIs ──
    const kpis: KpiStats = {
      revenue: {
        currentMonth: revenueStats.currentMonth,
        lastMonth: revenueStats.lastMonth,
        today: revenueStats.today,
        changePercent: calcChangePercent(
          revenueStats.currentMonth,
          revenueStats.lastMonth,
        ),
      },
      orders: {
        currentMonth: orderStats.currentMonth,
        lastMonth: orderStats.lastMonth,
        today: orderStats.today,
        changePercent: calcChangePercent(
          orderStats.currentMonth,
          orderStats.lastMonth,
        ),
      },
      todayScheduleCount,
      unpaid: unpaidStats,
    }

    // ── Pipeline (add percentages) ──
    const totalOrders = pipelineRaw.reduce((sum, item) => sum + item.count, 0)
    const pipeline: PipelineItem[] = pipelineRaw
      .map((item) => ({
        ...item,
        percentage: totalOrders > 0
          ? Math.round((item.count / totalOrders) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // ── Today Schedules (serialize dates) ──
    const todaySchedules: TodaySchedule[] = todaySchedulesRaw.map((s) => ({
      ...s,
      eventDate: s.eventDate.toISOString(),
    }))

    // ── Deadlines (add severity, serialize dates) ──
    const upcomingDeadlines: UpcomingDeadline[] = deadlinesRaw.map((d) => ({
      ...d,
      deadline: d.deadline.toISOString(),
      severity: getDeadlineSeverity(d.deadline),
    }))

    // ── Team (add capacity metrics) ──
    const teamWorkload: WorkerWorkload[] = teamRaw
      .map((w) => {
        const capacityPercent = Math.min(
          100,
          Math.round((w.activeJobs / MAX_WORKER_CAPACITY) * 100),
        )
        return {
          ...w,
          capacityPercent,
          isOverloaded: w.activeJobs >= MAX_WORKER_CAPACITY,
        }
      })
      .sort((a, b) => {
        if (a.isOverloaded !== b.isOverloaded) return a.isOverloaded ? -1 : 1
        return b.activeJobs - a.activeJobs
      })

    // ── Alerts ──
    const alerts = {
      ...alertsRaw,
      total:
        alertsRaw.overdueOrders +
        alertsRaw.unpaidOrders +
        alertsRaw.unassignedItems,
    }

    return {
      kpis,
      todaySchedules,
      pipeline,
      upcomingDeadlines,
      unpaidByUnit,
      teamWorkload,
      revenueChart,
      alerts,
    }
  },
}

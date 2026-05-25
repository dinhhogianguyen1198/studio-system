// ═══════════════════════════════════════════════════════════════
// Dashboard Types — Studio Production Command Center
// ═══════════════════════════════════════════════════════════════

// ── KPI Stats ────────────────────────────────────────────────

export interface KpiStats {
  revenue: {
    currentMonth: number
    lastMonth: number
    today: number
    changePercent: number
  }
  orders: {
    currentMonth: number
    lastMonth: number
    today: number
    changePercent: number
  }
  todayScheduleCount: number
  unpaid: {
    count: number
    totalAmount: number
  }
}

// ── Workflow Pipeline ────────────────────────────────────────

export interface PipelineItem {
  status: string
  label: string
  count: number
  percentage: number
}

// ── Today Schedule ───────────────────────────────────────────

export interface TodaySchedule {
  id: string
  orderItemId: string
  orderCode: string
  orderTitle: string
  customerName: string | null
  eventDate: string
  location: string | null
  serviceName: string
  assignedWorkers: Array<{
    name: string
    jobTypeName: string
  }>
}

// ── Upcoming Deadlines ───────────────────────────────────────

export type DeadlineSeverity = "overdue" | "urgent" | "warning" | "normal"

export interface UpcomingDeadline {
  id: string
  orderId: string
  orderCode: string
  orderTitle: string
  customerName: string | null
  deadline: string
  status: string
  assignedTo: string | null
  severity: DeadlineSeverity
}

// ── Unpaid Orders by Management Unit ─────────────────────────

export interface UnpaidByUnit {
  unitId: string | null
  unitName: string
  count: number
  totalUnpaid: number
}

// ── Team Workload ────────────────────────────────────────────

export interface WorkerWorkload {
  workerId: string
  name: string
  avatarUrl: string | null
  activeJobs: number
  completedThisMonth: number
  capacityPercent: number
  isOverloaded: boolean
  jobTypes: string[]
}

// ── Revenue Chart ────────────────────────────────────────────

export interface DailyRevenuePoint {
  date: string
  revenue: number
  orderCount: number
}

// ── Alerts ───────────────────────────────────────────────────

export interface DashboardAlerts {
  overdueOrders: number
  unpaidOrders: number
  unassignedItems: number
  total: number
}

// ── Aggregate Dashboard Data ─────────────────────────────────

export interface DashboardData {
  kpis: KpiStats
  todaySchedules: TodaySchedule[]
  pipeline: PipelineItem[]
  upcomingDeadlines: UpcomingDeadline[]
  unpaidByUnit: UnpaidByUnit[]
  teamWorkload: WorkerWorkload[]
  revenueChart: DailyRevenuePoint[]
  alerts: DashboardAlerts
}

// ── Component Props ──────────────────────────────────────────

export interface KpiCardData {
  label: string
  value: string
  todayLabel: string
  todayValue: string
  changePercent: number | null
  icon: React.ReactNode
}

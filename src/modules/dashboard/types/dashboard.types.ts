export interface StatCardData {
  title: string
  subtitle: string
  value: string
  todayLabel: string
  todayValue: string
  iconColor: string
  iconBg: string
  trend?: number
}

export interface ChartDataPoint {
  date: string
  newCustomers: number
  closedOrders: number
  closedRevenue: number
}

export interface DashboardStats {
  revenueThisMonth: number
  expectedRevenue: number | null
  incomeThisMonth: number
  ordersThisMonth: number
  customersThisMonth: number
  conversionRate: number
  ordersCreatedThisMonth: number
  closedListThisMonth: number
  revenueToday: number
  ordersToday: number
  customersNewToday: number
  conversionToday: number
  ordersCreatedToday: number
  closedListToday: number
  incomeTodayValue: number
  overdueTaskCount: number
  chartData: ChartDataPoint[]
}

import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Percent,
  FileText,
  ShoppingBag,
} from "lucide-react"
import { requireSession } from "@/shared/lib/auth-utils"
import { DashboardStatCard } from "@/modules/dashboard/components/DashboardStatCard"
import { DashboardOverdueBanner } from "@/modules/dashboard/components/DashboardOverdueBanner"
import { DashboardRevenueChart } from "@/modules/dashboard/components/DashboardRevenueChart"
import type { DashboardStats } from "@/modules/dashboard/types/dashboard.types"

// ─── Static demo data ─────────────────────────────────────────────────────────

function getDemoStats(): DashboardStats {
  const chartData = Array.from({ length: 31 }, (_, i) => ({
    date: `${String(i + 1).padStart(2, "0")}/05`,
    newCustomers: 0,
    closedOrders: 0,
    closedRevenue: 0,
  }))

  return {
    revenueThisMonth: 0,
    expectedRevenue: null,
    incomeThisMonth: 0,
    ordersThisMonth: 0,
    customersThisMonth: 0,
    conversionRate: 0,
    ordersCreatedThisMonth: 0,
    closedListThisMonth: 0,
    revenueToday: 0,
    ordersToday: 0,
    customersNewToday: 0,
    conversionToday: 0,
    ordersCreatedToday: 0,
    closedListToday: 0,
    incomeTodayValue: 0,
    overdueTaskCount: 2,
    chartData,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardHomePage() {
  const session = await requireSession()
  const stats = getDemoStats()
  const now = new Date()
  const formattedDate = format(now, "EEEE, 'Ngày' dd 'Tháng' MM 'Năm' yyyy", { locale: vi })
  const displayName = session.user.name ?? session.user.email ?? "Chủ Studio"

  const statCards = [
    {
      data: {
        title: "Doanh số tháng này",
        subtitle: "Theo ngày chụp",
        value: stats.revenueThisMonth.toLocaleString("vi-VN"),
        todayLabel: "Hôm nay",
        todayValue: String(stats.revenueToday),
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-50",
      },
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      data: {
        title: "Dự kiến doanh số",
        subtitle: "Theo ngày chụp",
        value: stats.expectedRevenue != null ? stats.expectedRevenue.toLocaleString("vi-VN") : "—",
        todayLabel: "Trạng thái",
        todayValue: stats.expectedRevenue != null ? "Đang tính" : "Không áp dụng",
        iconColor: "text-purple-600",
        iconBg: "bg-purple-50",
      },
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      data: {
        title: "Doanh thu tháng này",
        subtitle: "Theo ngày thu",
        value: stats.incomeThisMonth.toLocaleString("vi-VN"),
        todayLabel: "Hôm nay",
        todayValue: String(stats.incomeTodayValue),
        iconColor: "text-blue-600",
        iconBg: "bg-blue-50",
      },
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      data: {
        title: "Đơn hàng tháng này",
        subtitle: "Theo ngày chụp",
        value: String(stats.ordersThisMonth),
        todayLabel: "Hôm nay",
        todayValue: String(stats.ordersToday),
        iconColor: "text-rose-600",
        iconBg: "bg-rose-50",
      },
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      data: {
        title: "Khách hàng tháng này",
        subtitle: "Theo ngày tạo",
        value: String(stats.customersThisMonth),
        todayLabel: "Khách mới hôm nay",
        todayValue: String(stats.customersNewToday),
        iconColor: "text-orange-600",
        iconBg: "bg-orange-50",
      },
      icon: <Users className="w-5 h-5" />,
    },
    {
      data: {
        title: "Tỷ lệ chuyển đổi",
        subtitle: "Theo ngày tạo",
        value: `${stats.conversionRate}%`,
        todayLabel: "Hôm nay",
        todayValue: `${stats.conversionToday}%`,
        iconColor: "text-amber-600",
        iconBg: "bg-amber-50",
      },
      icon: <Percent className="w-5 h-5" />,
    },
    {
      data: {
        title: "Đơn tạo tháng này",
        subtitle: "Theo ngày tạo",
        value: String(stats.ordersCreatedThisMonth),
        todayLabel: "Hôm nay",
        todayValue: String(stats.ordersCreatedToday),
        iconColor: "text-violet-600",
        iconBg: "bg-violet-50",
      },
      icon: <FileText className="w-5 h-5" />,
    },
    {
      data: {
        title: "DS chốt tháng này",
        subtitle: "Theo ngày tạo",
        value: String(stats.closedListThisMonth),
        todayLabel: "Hôm nay",
        todayValue: String(stats.closedListToday),
        iconColor: "text-teal-600",
        iconBg: "bg-teal-50",
      },
      icon: <ShoppingBag className="w-5 h-5" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Overdue banner */}
      <DashboardOverdueBanner
        overdueCount={stats.overdueTaskCount}
        totalPendingCount={stats.overdueTaskCount}
      />

      {/* Greeting */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Xin chào,{" "}
            <span className="text-primary">{displayName}</span>{" "}
            <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{formattedDate}</p>
        </div>

        {/* Period filter — static demo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground cursor-default select-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Tháng này
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground cursor-default select-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Toàn studio
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <DashboardStatCard key={card.data.title} data={card.data} icon={card.icon} />
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Doanh số chốt theo ngày</h2>
          <span className="text-xs text-muted-foreground">(theo ngày tạo đơn)</span>
        </div>
        <div className="mt-4">
          <DashboardRevenueChart data={stats.chartData} />
        </div>
      </div>
    </div>
  )
}

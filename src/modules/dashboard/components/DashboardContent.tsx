import { dashboardService } from "../service/dashboard.service"
import { DashboardHeader } from "./DashboardHeader"
import { DashboardAlertsBanner } from "./DashboardAlertsBanner"
import { KpiCardGroup } from "./widgets/KpiCardGroup"
import { TodayScheduleWidget } from "./widgets/TodayScheduleWidget"
import { WorkflowPipelineWidget } from "./widgets/WorkflowPipelineWidget"
import { DeadlinesWidget } from "./widgets/DeadlinesWidget"
import { UnpaidOrdersWidget } from "./widgets/UnpaidOrdersWidget"
import { TeamPerformanceWidget } from "./widgets/TeamPerformanceWidget"
import { RevenueChartWidget } from "./widgets/RevenueChartWidget"

interface DashboardContentProps {
  user: { name?: string | null; email?: string | null }
}

export async function DashboardContent({
  user,
}: DashboardContentProps): Promise<React.ReactElement> {
  const data = await dashboardService.getDashboardData()
  const displayName = user.name ?? user.email ?? "Chủ Studio"

  return (
    <div className="space-y-6">
      {/* 1. Header — Greeting + Quick Actions */}
      <DashboardHeader userName={displayName} />

      {/* 2. Alerts Banner — Conditional */}
      {data.alerts.total > 0 && (
        <DashboardAlertsBanner alerts={data.alerts} />
      )}

      {/* 3. KPI Cards — 4 columns */}
      <KpiCardGroup stats={data.kpis} />

      {/* 4. Main Content — 2 columns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TodayScheduleWidget schedules={data.todaySchedules} />
        <WorkflowPipelineWidget pipeline={data.pipeline} />
      </div>

      {/* 5. Secondary Content — 3 columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        <DeadlinesWidget deadlines={data.upcomingDeadlines} />
        <UnpaidOrdersWidget data={data.unpaidByUnit} />
        <TeamPerformanceWidget team={data.teamWorkload} />
      </div>

      {/* 6. Revenue Chart — Full width */}
      <RevenueChartWidget data={data.revenueChart} />
    </div>
  )
}

import { Suspense } from "react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { financeReportService } from "@/modules/finance/service/finance-report.service"
import { RevenueExpenseChart } from "@/modules/finance/components/dashboard/RevenueExpenseChart"
import { ExpenseBreakdownChart } from "@/modules/finance/components/dashboard/ExpenseBreakdownChart"
import { OrderProfitTable } from "@/modules/finance/components/dashboard/OrderProfitTable"
import { TopServicesTable } from "@/modules/finance/components/reports/TopServicesTable"
import { FinancialKpiCards } from "@/modules/finance/components/dashboard/FinancialKpiCards"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  searchParams: Promise<{ from?: string; to?: string; groupBy?: string }>
}

async function ReportContent({
  from,
  to,
  groupBy,
}: {
  from: string
  to: string
  groupBy: "day" | "week" | "month"
}) {
  const [kpi, trend, orderProfit, topServices, expenseBreakdown] = await Promise.all([
    financeReportService.getKpi(from, to),
    financeReportService.getRevenueExpenseTrend(from, to, groupBy),
    financeReportService.getOrderProfitReport(from, to),
    financeReportService.getTopServices(from, to),
    financeReportService.getExpenseBreakdown(from, to),
  ])

  return (
    <div className="space-y-6">
      <FinancialKpiCards kpi={kpi} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueExpenseChart data={trend} title="Xu hướng doanh thu & chi phí" />
        </div>
        <ExpenseBreakdownChart data={expenseBreakdown} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <OrderProfitTable data={orderProfit} />
        <TopServicesTable data={topServices} />
      </div>
    </div>
  )
}

export default async function FinancialReportsPage({ searchParams }: Props) {
  await requirePermission("finance_reports", "read")

  const params = await searchParams
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
  const defaultTo = now.toISOString().slice(0, 10)

  const from = params.from ?? defaultFrom
  const to = params.to ?? defaultTo
  const groupBy = (params.groupBy as "day" | "week" | "month") ?? "month"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Báo cáo tài chính</h1>
          <p className="text-sm text-muted-foreground">
            Từ {from} đến {to}
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-lg" />
          </div>
        }
      >
        <ReportContent from={from} to={to} groupBy={groupBy} />
      </Suspense>
    </div>
  )
}

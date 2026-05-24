import { Suspense } from "react"
import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { financeReportService } from "@/modules/finance/service/finance-report.service"
import { FinancialKpiCards } from "@/modules/finance/components/dashboard/FinancialKpiCards"
import { RevenueExpenseChart } from "@/modules/finance/components/dashboard/RevenueExpenseChart"
import { ExpenseBreakdownChart } from "@/modules/finance/components/dashboard/ExpenseBreakdownChart"
import { OrderProfitTable } from "@/modules/finance/components/dashboard/OrderProfitTable"
import { Button } from "@/components/ui/button"
import { FileText, Receipt, TrendingUp, Wallet } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function getDefaultPeriod() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { from, to }
}

async function FinanceDashboardContent() {
  const { from, to } = getDefaultPeriod()

  const [kpi, trend, orderProfit, expenseBreakdown] = await Promise.all([
    financeReportService.getKpi(from, to),
    financeReportService.getRevenueExpenseTrend(
      new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
      to,
      "month",
    ),
    financeReportService.getOrderProfitReport(from, to),
    financeReportService.getExpenseBreakdown(from, to),
  ])

  return (
    <div className="space-y-6">
      <FinancialKpiCards kpi={kpi} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueExpenseChart data={trend} title="Xu hướng doanh thu & chi phí (năm nay)" />
        </div>
        <ExpenseBreakdownChart data={expenseBreakdown} />
      </div>
      <OrderProfitTable data={orderProfit} />
    </div>
  )
}

export default async function FinanceDashboardPage() {
  await requirePermission("finance_dashboard", "read")

  const now = new Date()
  const monthName = now.toLocaleString("vi-VN", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tổng quan tài chính</h1>
          <p className="text-sm text-muted-foreground">Dữ liệu {monthName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/finance/reports">
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              Báo cáo
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/finance/expenses"
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-600">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Chi phí</p>
            <p className="text-xs text-muted-foreground">Quản lý chi phí</p>
          </div>
        </Link>
        <Link
          href="/dashboard/finance/invoices"
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Hóa đơn</p>
            <p className="text-xs text-muted-foreground">Quản lý hóa đơn</p>
          </div>
        </Link>
        <Link
          href="/dashboard/finance/payroll"
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-600">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Thanh toán</p>
            <p className="text-xs text-muted-foreground">Lương freelancer</p>
          </div>
        </Link>
        <Link
          href="/dashboard/finance/reports"
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-purple-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Báo cáo</p>
            <p className="text-xs text-muted-foreground">Phân tích tài chính</p>
          </div>
        </Link>
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
        <FinanceDashboardContent />
      </Suspense>
    </div>
  )
}

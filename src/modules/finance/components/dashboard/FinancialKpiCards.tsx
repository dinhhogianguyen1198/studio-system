"use client"

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Users,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FinancialKpi } from "../../types/finance.types"

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ"
}

function formatPercent(value: number): string {
  return value.toFixed(1) + "%"
}

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  badge?: { label: string; variant: "destructive" | "warning" | "success" | "muted" }
}

function KpiCard({ title, value, subtitle, icon, trend, badge }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {trend === "up" && <TrendingUp className="mb-1 h-4 w-4 text-emerald-600" />}
          {trend === "down" && <TrendingDown className="mb-1 h-4 w-4 text-red-500" />}
        </div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        {badge && (
          <Badge variant={badge.variant} className="mt-2 text-xs">
            {badge.label}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

interface Props {
  kpi: FinancialKpi
}

export function FinancialKpiCards({ kpi }: Props) {
  const isProfit = kpi.netProfit >= 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Doanh thu"
        value={formatVnd(kpi.totalRevenue)}
        subtitle="Tổng thu đã nhận trong kỳ"
        icon={<DollarSign className="h-4 w-4" />}
        trend="up"
      />
      <KpiCard
        title="Chi phí vận hành"
        value={formatVnd(kpi.totalExpenses)}
        subtitle="Chi phí đã thanh toán trong kỳ"
        icon={<TrendingDown className="h-4 w-4" />}
      />
      <KpiCard
        title="Chi phí nhân sự"
        value={formatVnd(kpi.totalWorkerCosts)}
        subtitle="Tổng lương freelancer hoàn thành"
        icon={<Users className="h-4 w-4" />}
      />
      <KpiCard
        title="Lợi nhuận ròng"
        value={formatVnd(kpi.netProfit)}
        subtitle={`Tỷ suất: ${formatPercent(kpi.netMargin)}`}
        icon={<TrendingUp className="h-4 w-4" />}
        trend={isProfit ? "up" : "down"}
        badge={
          !isProfit
            ? { label: "Đang lỗ", variant: "destructive" }
            : kpi.netMargin < 10
              ? { label: "Biên thấp", variant: "warning" }
              : { label: "Khỏe mạnh", variant: "success" }
        }
      />
      <KpiCard
        title="Công nợ phải thu"
        value={formatVnd(kpi.outstandingReceivables)}
        subtitle={`${kpi.overdueInvoicesCount} hóa đơn quá hạn`}
        icon={<FileText className="h-4 w-4" />}
        badge={
          kpi.overdueInvoicesCount > 0
            ? { label: `${kpi.overdueInvoicesCount} quá hạn`, variant: "destructive" }
            : undefined
        }
      />
      <KpiCard
        title="Công nợ phải trả"
        value={formatVnd(kpi.pendingPayables)}
        subtitle="Chi phí đã duyệt chưa trả"
        icon={<AlertTriangle className="h-4 w-4" />}
        badge={
          kpi.pendingPayables > 0
            ? { label: "Cần thanh toán", variant: "warning" }
            : undefined
        }
      />
      <KpiCard
        title="Freelancer chưa trả"
        value={String(kpi.unpaidFreelancerCount) + " người"}
        subtitle="Có công việc hoàn thành chưa thanh toán"
        icon={<Users className="h-4 w-4" />}
        badge={
          kpi.unpaidFreelancerCount > 0
            ? { label: "Cần xử lý", variant: "warning" }
            : { label: "Đã thanh toán hết", variant: "success" }
        }
      />
      <KpiCard
        title="Lợi nhuận gộp"
        value={formatVnd(kpi.grossProfit)}
        subtitle={`Tỷ suất gộp: ${formatPercent(kpi.grossMargin)}`}
        icon={<TrendingUp className="h-4 w-4" />}
        trend={kpi.grossProfit >= 0 ? "up" : "down"}
      />
    </div>
  )
}

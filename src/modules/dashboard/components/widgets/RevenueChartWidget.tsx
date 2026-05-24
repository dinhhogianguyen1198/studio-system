"use client"

import { TrendingUp } from "lucide-react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { WidgetShell } from "../shared/WidgetShell"
import { EmptyState } from "../shared/EmptyState"
import type { DailyRevenuePoint } from "../../types/dashboard.types"

interface RevenueChartWidgetProps {
  data: DailyRevenuePoint[]
}

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

function formatVnd(value: number): string {
  return value.toLocaleString("vi-VN") + " ₫"
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}): React.ReactElement | null {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-4 text-xs"
        >
          <span className="text-muted-foreground">
            {entry.dataKey === "revenue" ? "Doanh thu" : "Số đơn"}
          </span>
          <span className="font-medium tabular-nums">
            {entry.dataKey === "revenue"
              ? formatVnd(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChartWidget({
  data,
}: RevenueChartWidgetProps): React.ReactElement {
  const hasData = data.some((d) => d.revenue > 0 || d.orderCount > 0)

  return (
    <WidgetShell
      title="Doanh thu theo ngày"
      subtitle="30 ngày gần nhất"
      icon={TrendingUp}
    >
      {!hasData ? (
        <EmptyState
          icon={TrendingUp}
          title="Chưa có dữ liệu doanh thu"
          description="Dữ liệu sẽ hiển thị khi có thanh toán"
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              tickFormatter={formatRevenue}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) =>
                value === "revenue" ? "Doanh thu" : "Số đơn"
              }
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar
              yAxisId="revenue"
              dataKey="revenue"
              fill="var(--chart-1)"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="orderCount"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 2, fill: "var(--chart-2)" }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </WidgetShell>
  )
}

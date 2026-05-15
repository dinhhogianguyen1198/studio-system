"use client"

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
import type { ChartDataPoint } from "@/modules/dashboard/types/dashboard.types"

interface DashboardRevenueChartProps {
  data: ChartDataPoint[]
}

const CHART_COLORS = {
  newCustomers: "#93c5fd",
  closedOrders: "#1e40af",
  closedRevenue: "#f97316",
}

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

export function DashboardRevenueChart({ data }: DashboardRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="count"
          orientation="left"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={30}
        />
        <YAxis
          yAxisId="revenue"
          orientation="right"
          tickFormatter={formatRevenue}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              newCustomers: "Khách mới",
              closedOrders: "Đơn chốt",
              closedRevenue: "Doanh số chốt",
            }
            const numVal = typeof value === "number" ? value : 0
            const strName = String(name)
            return [strName === "closedRevenue" ? formatRevenue(numVal) : numVal, labels[strName] ?? strName]
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              newCustomers: "Khách mới",
              closedOrders: "Đơn chốt",
              closedRevenue: "Doanh số chốt",
            }
            return (
              <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
                {labels[value] ?? value}
              </span>
            )
          }}
        />
        <Bar
          yAxisId="count"
          dataKey="newCustomers"
          fill={CHART_COLORS.newCustomers}
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
        <Bar
          yAxisId="count"
          dataKey="closedOrders"
          fill={CHART_COLORS.closedOrders}
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="closedRevenue"
          stroke={CHART_COLORS.closedRevenue}
          strokeWidth={2}
          dot={{ r: 3, fill: CHART_COLORS.closedRevenue }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

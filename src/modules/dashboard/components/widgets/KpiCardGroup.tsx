"use client"

import { m, LazyMotion, domAnimation } from "framer-motion"
import { DollarSign, ShoppingCart, Camera, AlertTriangle } from "lucide-react"
import { KpiCard } from "./KpiCard"
import type { KpiStats, KpiCardData } from "../../types/dashboard.types"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + " ₫"
}

interface KpiCardGroupProps {
  stats: KpiStats
}

export function KpiCardGroup({ stats }: KpiCardGroupProps): React.ReactElement {
  const cards: KpiCardData[] = [
    {
      label: "Doanh thu tháng",
      value: formatCurrency(stats.revenue.currentMonth),
      todayLabel: "Hôm nay",
      todayValue: formatCurrency(stats.revenue.today),
      changePercent: stats.revenue.changePercent,
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: "Đơn hàng tháng",
      value: String(stats.orders.currentMonth),
      todayLabel: "Hôm nay",
      todayValue: `${stats.orders.today} đơn`,
      changePercent: stats.orders.changePercent,
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      label: "Lịch hôm nay",
      value: String(stats.todayScheduleCount),
      todayLabel: "Trạng thái",
      todayValue: stats.todayScheduleCount > 0 ? "Đang hoạt động" : "Trống lịch",
      changePercent: null,
      icon: <Camera className="h-4 w-4" />,
    },
    {
      label: "Chưa thanh toán",
      value: `${stats.unpaid.count} đơn`,
      todayLabel: "Tổng nợ",
      todayValue: formatCurrency(stats.unpaid.totalAmount),
      changePercent: null,
      icon: <AlertTriangle className="h-4 w-4" />,
    },
  ]

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {cards.map((card) => (
          <KpiCard key={card.label} data={card} />
        ))}
      </m.div>
    </LazyMotion>
  )
}

"use client"

import { m, LazyMotion, domAnimation } from "framer-motion"
import { TrendBadge } from "../shared/TrendBadge"
import type { KpiCardData } from "../../types/dashboard.types"

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

interface KpiCardProps {
  data: KpiCardData
}

export function KpiCard({ data }: KpiCardProps): React.ReactElement {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        variants={cardVariants}
        className="bg-card border border-border rounded-lg p-5 transition-all duration-200 hover:shadow-sm hover:border-border/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {data.label}
          </span>
          <span className="text-muted-foreground">{data.icon}</span>
        </div>

        {/* Value */}
        <p className="text-3xl font-bold tracking-tight tabular-nums mt-2">
          {data.value}
        </p>

        {/* Trend */}
        {data.changePercent !== null && (
          <div className="mt-1.5">
            <TrendBadge value={data.changePercent} />
          </div>
        )}

        {/* Divider + Today Detail */}
        <div className="border-t border-border/50 mt-3 pt-3">
          <p className="text-xs text-muted-foreground">
            {data.todayLabel}:{" "}
            <span className="font-medium text-foreground">
              {data.todayValue}
            </span>
          </p>
        </div>
      </m.div>
    </LazyMotion>
  )
}

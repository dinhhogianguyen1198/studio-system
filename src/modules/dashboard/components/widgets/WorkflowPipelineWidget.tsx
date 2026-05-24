"use client"

import { m, LazyMotion, domAnimation } from "framer-motion"
import { Layers } from "lucide-react"
import Link from "next/link"
import { WidgetShell } from "../shared/WidgetShell"
import { EmptyState } from "../shared/EmptyState"
import type { PipelineItem } from "../../types/dashboard.types"

const barColors = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-muted-foreground",
]

interface WorkflowPipelineWidgetProps {
  pipeline: PipelineItem[]
}

export function WorkflowPipelineWidget({
  pipeline,
}: WorkflowPipelineWidgetProps): React.ReactElement {
  const total = pipeline.reduce((sum, item) => sum + item.count, 0)

  return (
    <WidgetShell
      title="Pipeline đơn hàng"
      subtitle={total > 0 ? `${total} đơn hàng` : undefined}
      icon={Layers}
      action={
        total > 0
          ? { label: "Xem tất cả", href: "/dashboard/orders" }
          : undefined
      }
    >
      {pipeline.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Chưa có đơn hàng"
          description="Tạo đơn hàng đầu tiên"
          action={{ label: "Tạo đơn hàng", href: "/dashboard/orders/new" }}
        />
      ) : (
        <LazyMotion features={domAnimation}>
          <div className="space-y-3">
            {pipeline.map((item, index) => (
              <Link
                key={item.status}
                href={`/dashboard/orders?status=${item.status}`}
                className="flex items-center gap-3 group"
              >
                {/* Label */}
                <span className="text-sm min-w-[100px] truncate text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>

                {/* Bar */}
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <m.div
                    className={`h-full rounded-full ${barColors[index % barColors.length]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.08,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* Count */}
                <span className="text-sm font-medium tabular-nums min-w-[32px] text-right">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </LazyMotion>
      )}
    </WidgetShell>
  )
}

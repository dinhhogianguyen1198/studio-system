"use client"

import { m, LazyMotion, domAnimation } from "framer-motion"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { WidgetShell } from "../shared/WidgetShell"
import { EmptyState } from "../shared/EmptyState"
import type { WorkerWorkload } from "../../types/dashboard.types"

interface TeamPerformanceWidgetProps {
  team: WorkerWorkload[]
}

function getCapacityColor(percent: number): string {
  if (percent < 60) return "bg-chart-2"
  if (percent <= 85) return "bg-chart-4"
  return "bg-chart-5"
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function TeamPerformanceWidget({
  team,
}: TeamPerformanceWidgetProps): React.ReactElement {
  const displayTeam = team.slice(0, 8)
  const activeCount = team.filter((w) => w.activeJobs > 0).length

  return (
    <WidgetShell
      title="Nhân sự"
      subtitle={activeCount > 0 ? `${activeCount} đang làm việc` : undefined}
      icon={Users}
      action={
        team.length > 0
          ? { label: "Xem tất cả", href: "/dashboard/workforce/workers" }
          : undefined
      }
    >
      {team.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Chưa có nhân sự"
          description="Thêm nhân sự vào hệ thống"
          action={{ label: "Thêm nhân sự", href: "/dashboard/workforce/workers" }}
        />
      ) : (
        <LazyMotion features={domAnimation}>
          <div className="space-y-0">
            {displayTeam.map((worker, index) => (
              <div
                key={worker.workerId}
                className={cn(
                  "flex items-center gap-3 py-2.5",
                  index < displayTeam.length - 1 && "border-b border-border/50",
                )}
              >
                {/* Avatar */}
                {worker.avatarUrl ? (
                  <img
                    src={worker.avatarUrl}
                    alt={worker.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {getInitials(worker.name)}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {worker.name}
                    </span>
                    {worker.isOverloaded && (
                      <span className="text-[10px] font-medium bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                        Quá tải
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {worker.jobTypes.join(", ") || "Chưa phân loại"}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="text-sm tabular-nums">
                    <span className="font-medium">{worker.activeJobs}</span>
                    <span className="text-muted-foreground text-xs ml-0.5">
                      đang làm
                    </span>
                  </p>
                  {/* Capacity Bar */}
                  <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden mt-1">
                    <m.div
                      className={cn(
                        "h-full rounded-full",
                        getCapacityColor(worker.capacityPercent),
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${worker.capacityPercent}%` }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.05,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LazyMotion>
      )}
    </WidgetShell>
  )
}

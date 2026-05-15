import { cn } from "@/lib/utils"
import type { StatCardData } from "@/modules/dashboard/types/dashboard.types"

interface DashboardStatCardProps {
  data: StatCardData
  icon: React.ReactNode
}

export function DashboardStatCard({ data, icon }: DashboardStatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-foreground leading-tight">{data.title}</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            {data.subtitle}
          </p>
        </div>
        <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", data.iconBg)}>
          <span className={data.iconColor}>{icon}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold text-foreground tracking-tight">{data.value}</p>
        <p className="text-xs text-muted-foreground">
          {data.todayLabel}:{" "}
          <span className="font-medium text-foreground">{data.todayValue}</span>
        </p>
      </div>
    </div>
  )
}

import { CalendarDays, MapPin } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { WidgetShell } from "../shared/WidgetShell"
import { EmptyState } from "../shared/EmptyState"
import type { TodaySchedule } from "../../types/dashboard.types"

interface TodayScheduleWidgetProps {
  schedules: TodaySchedule[]
}

function formatTime(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

export function TodayScheduleWidget({
  schedules,
}: TodayScheduleWidgetProps): React.ReactElement {
  const displayCount = Math.min(schedules.length, 6)
  const remaining = schedules.length - displayCount

  return (
    <WidgetShell
      title="Lịch hôm nay"
      subtitle={
        schedules.length > 0
          ? `${schedules.length} lịch trình`
          : undefined
      }
      icon={CalendarDays}
      action={
        schedules.length > 0
          ? { label: "Xem tất cả", href: "/dashboard/orders" }
          : undefined
      }
    >
      {schedules.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Không có lịch hôm nay"
          description="Tạo đơn hàng mới để thêm lịch chụp"
          action={{ label: "Tạo đơn hàng", href: "/dashboard/orders/new" }}
        />
      ) : (
        <div className="space-y-0">
          {schedules.slice(0, displayCount).map((schedule, index) => (
            <Link
              key={schedule.orderItemId}
              href={`/dashboard/orders/${schedule.id}`}
              className={cn(
                "flex gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors group",
                index < displayCount - 1 && "border-b border-border",
              )}
            >
              {/* Time */}
              <div className="shrink-0 pt-0.5">
                <span className="text-xs font-medium tabular-nums bg-muted px-2 py-1 rounded-md">
                  {formatTime(schedule.eventDate)}
                </span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate group-hover:text-foreground">
                    {schedule.orderTitle}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                    {schedule.orderCode}
                  </span>
                </div>
                {schedule.customerName && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {schedule.customerName}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {schedule.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">
                        {schedule.location}
                      </span>
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {schedule.serviceName}
                  </span>
                </div>
                {schedule.assignedWorkers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {schedule.assignedWorkers.map((w, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded"
                      >
                        {w.name}
                        <span className="text-muted-foreground ml-0.5">
                          · {w.jobTypeName}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}

          {remaining > 0 && (
            <div className="pt-2 text-center">
              <Link
                href="/dashboard/orders"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                +{remaining} lịch trình khác →
              </Link>
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  )
}

import { Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { differenceInDays, format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { WidgetShell } from "../shared/WidgetShell"
import { EmptyState } from "../shared/EmptyState"
import type { UpcomingDeadline, DeadlineSeverity } from "../../types/dashboard.types"

const severityDot: Record<DeadlineSeverity, string> = {
  overdue: "bg-destructive",
  urgent: "bg-warning-foreground",
  warning: "bg-accent-gold",
  normal: "bg-muted-foreground/30",
}

const severityText: Record<DeadlineSeverity, string> = {
  overdue: "text-destructive font-medium",
  urgent: "text-warning-foreground",
  warning: "text-accent-gold-foreground",
  normal: "text-muted-foreground",
}

interface DeadlinesWidgetProps {
  deadlines: UpcomingDeadline[]
}

function getDeadlineLabel(deadline: string): string {
  const days = differenceInDays(new Date(deadline), new Date())
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`
  if (days === 0) return "Hôm nay"
  if (days === 1) return "Ngày mai"
  return `Còn ${days} ngày`
}

export function DeadlinesWidget({
  deadlines,
}: DeadlinesWidgetProps): React.ReactElement {
  return (
    <WidgetShell
      title="Deadline sắp tới"
      icon={Clock}
      action={
        deadlines.length > 0
          ? { label: "Xem tất cả", href: "/dashboard/orders" }
          : undefined
      }
    >
      {deadlines.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Không có deadline gần"
          description="Tất cả công việc đang đúng tiến độ"
        />
      ) : (
        <div className="space-y-0">
          {deadlines.map((item, index) => (
            <Link
              key={item.id}
              href={`/dashboard/orders/${item.orderId}`}
              className={cn(
                "flex items-start gap-3 py-2.5 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors",
                index < deadlines.length - 1 && "border-b border-border/50",
              )}
            >
              {/* Severity Dot */}
              <span
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                  severityDot[item.severity],
                )}
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {item.orderTitle}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                    {item.orderCode}
                  </span>
                </div>
                {item.customerName && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.customerName}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn("text-xs", severityText[item.severity])}
                  >
                    {getDeadlineLabel(item.deadline)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {format(new Date(item.deadline), "dd/MM", { locale: vi })}
                  </span>
                </div>
                {item.assignedTo && (
                  <span className="inline-flex text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded mt-1">
                    {item.assignedTo}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

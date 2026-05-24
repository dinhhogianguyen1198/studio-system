import { AlertTriangle, Clock, UserX, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { DashboardAlerts } from "../types/dashboard.types"

interface DashboardAlertsBannerProps {
  alerts: DashboardAlerts
}

interface AlertItem {
  icon: React.ReactNode
  label: string
  count: number
  severity: "critical" | "warning" | "info"
  href: string
}

const severityStyles = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning text-warning-foreground border-warning-foreground/20",
  info: "bg-info text-info-foreground border-info-foreground/20",
}

export function DashboardAlertsBanner({
  alerts,
}: DashboardAlertsBannerProps): React.ReactElement {
  const items: AlertItem[] = []

  if (alerts.overdueOrders > 0) {
    items.push({
      icon: <Clock className="h-3.5 w-3.5" />,
      label: "đơn quá hạn",
      count: alerts.overdueOrders,
      severity: "critical",
      href: "/dashboard/orders?status=OVERDUE",
    })
  }

  if (alerts.unpaidOrders > 0) {
    items.push({
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: "đơn chưa thanh toán",
      count: alerts.unpaidOrders,
      severity: "warning",
      href: "/dashboard/orders",
    })
  }

  if (alerts.unassignedItems > 0) {
    items.push({
      icon: <UserX className="h-3.5 w-3.5" />,
      label: "việc chưa gán",
      count: alerts.unassignedItems,
      severity: "info",
      href: "/dashboard/orders",
    })
  }

  if (items.length === 0) return <></>

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80",
            severityStyles[item.severity],
          )}
        >
          {item.icon}
          <span className="tabular-nums font-bold">{item.count}</span>
          <span>{item.label}</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </Link>
      ))}
    </div>
  )
}

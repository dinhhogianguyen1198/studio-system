"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
  User,
  ChevronRight,
  GripVertical,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { KanbanOrder } from "../../types/production.types"
import {
  ORDER_STATUS_BORDER_CLASS,
} from "../../types/production.types"

interface KanbanCardProps {
  order: KanbanOrder
  isDragDisabled?: boolean
}

const PRIORITY_CONFIG = {
  overdue: {
    label: "Trễ hạn",
    className: "bg-destructive/15 border-destructive/30 text-destructive",
    dot: "bg-destructive",
  },
  urgent: {
    label: "Gấp",
    className: "bg-warning/15 border-warning/30 text-warning-foreground",
    dot: "bg-warning",
  },
  high: {
    label: "Sắp đến hạn",
    className: "bg-info/15 border-info/30 text-info-foreground",
    dot: "bg-info",
  },
  normal: {
    label: "",
    className: "",
    dot: "bg-muted-foreground",
  },
}

export function KanbanCard({ order, isDragDisabled = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
    disabled: isDragDisabled,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const prio = PRIORITY_CONFIG[order.priority]
  const borderClass = ORDER_STATUS_BORDER_CLASS[order.status] ?? "border-border"
  const deliveryProgress =
    order.totalItemCount > 0
      ? Math.round((order.deliveredCount / order.totalItemCount) * 100)
      : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card shadow-sm",
        "transition-all duration-150",
        borderClass,
        isDragging && "opacity-50 scale-[0.97] shadow-lg ring-2 ring-primary/20",
        !isDragDisabled && "cursor-grab active:cursor-grabbing",
        isDragDisabled && "cursor-default",
      )}
    >
      {/* Priority indicator strip */}
      {order.priority !== "normal" && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg",
            order.priority === "overdue" && "bg-destructive",
            order.priority === "urgent" && "bg-warning",
            order.priority === "high" && "bg-info",
          )}
        />
      )}

      <div className="pl-3 pr-2.5 pt-2.5 pb-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Drag handle */}
            {!isDragDisabled && (
              <div
                {...attributes}
                {...listeners}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 mt-0.5"
              >
                <GripVertical className="h-3 w-3" />
              </div>
            )}

            <Link
              href={`/dashboard/orders/${order.id}`}
              className="font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {order.orderNumber}
            </Link>
          </div>

          {/* Priority badge */}
          {order.priority !== "normal" && (
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium border",
                prio.className,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", prio.dot)} />
              {prio.label}
            </span>
          )}
        </div>

        {/* Customer / Party name */}
        <div className="mb-2">
          <p className="text-xs font-medium text-foreground leading-tight truncate">
            {order.customer?.name ?? order.contactName}
          </p>
          {order.customer && order.contactName !== order.customer.name && (
            <p className="text-[11px] text-muted-foreground truncate">{order.contactName}</p>
          )}
        </div>

        {/* Dates row */}
        <div className="flex flex-col gap-0.5 mb-2.5">
          {order.nearestEventDate && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>Chụp: {format(order.nearestEventDate, "dd/MM/yyyy")}</span>
            </div>
          )}
          {order.nearestDeadline && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-[11px]",
                order.priority === "overdue"
                  ? "text-destructive font-medium"
                  : order.priority === "urgent"
                    ? "text-warning-foreground font-medium"
                    : "text-muted-foreground",
              )}
            >
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {order.priority === "overdue"
                  ? `Trễ ${formatDistanceToNow(order.nearestDeadline, { locale: vi })}`
                  : order.daysUntilDeadline != null && order.daysUntilDeadline <= 7
                    ? `Còn ${order.daysUntilDeadline} ngày`
                    : format(order.nearestDeadline, "dd/MM/yyyy")}
              </span>
            </div>
          )}
        </div>

        {/* Delivery progress */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>
                {order.deliveredCount}/{order.totalItemCount} items
              </span>
            </div>
            {order.totalItemCount > 0 && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {deliveryProgress}%
              </span>
            )}
          </div>
          {order.totalItemCount > 0 && (
            <div className="h-0.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  deliveryProgress === 100
                    ? "bg-success"
                    : deliveryProgress > 50
                      ? "bg-info"
                      : "bg-muted-foreground/40",
                )}
                style={{ width: `${deliveryProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Footer: workers + payment status */}
        <div className="flex items-center justify-between gap-2">
          {/* Assigned workers */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
            {order.items.some((i) => i.assignedTo) && (
              <>
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {Array.from(
                    new Set(
                      order.items
                        .filter((i) => i.assignedTo)
                        .map((i) => i.assignedTo!.name ?? ""),
                    ),
                  ).join(", ")}
                </span>
              </>
            )}
          </div>

          {/* Payment indicator */}
          <div className="flex items-center gap-1 shrink-0">
            {order.isFullyPaid ? (
              <CheckCircle2 className="h-3 w-3 text-success-foreground" />
            ) : (
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {((order.paidAmount / (order.totalAmount || 1)) * 100).toFixed(0)}% TT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick navigate arrow (hover only) */}
      <Link
        href={`/dashboard/orders/${order.id}`}
        className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
        title="Xem chi tiết"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

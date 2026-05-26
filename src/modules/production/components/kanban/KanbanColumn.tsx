"use client"

import { useRef } from "react"
import { useDroppable } from "@dnd-kit/core"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { KanbanColumnMeta } from "../../types/production.types"
import { KanbanCard } from "./KanbanCard"

interface KanbanColumnProps {
  column: KanbanColumnMeta
  isDragActive: boolean
  activeOrderStatus?: string
}

const COLUMN_HEADER_ACCENT: Record<string, string> = {
  NEW: "border-t-muted-foreground/40",
  WAITING_FILES: "border-t-indicator-warning",
  PARTIAL_DELIVERY: "border-t-indicator-info",
  OVERDUE: "border-t-indicator-danger",
  FILES_DELIVERED: "border-t-indicator-success",
  COMPLETED: "border-t-primary",
}

const COLUMN_COUNT_BADGE: Record<string, string> = {
  NEW: "bg-muted text-muted-foreground",
  WAITING_FILES: "bg-indicator-warning/15 text-indicator-warning",
  PARTIAL_DELIVERY: "bg-indicator-info/15 text-indicator-info",
  OVERDUE: "bg-indicator-danger/15 text-indicator-danger",
  FILES_DELIVERED: "bg-indicator-success/15 text-indicator-success",
  COMPLETED: "bg-primary/10 text-foreground",
}

// Approximate card height (px) + gap-2 between cards
const CARD_ESTIMATE_PX = 208
const CARD_GAP_PX = 8

export function KanbanColumn({ column, isDragActive, activeOrderStatus }: KanbanColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.status })
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: column.orders.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_ESTIMATE_PX + CARD_GAP_PX,
    overscan: 3,
  })

  const isValidDropTarget =
    isDragActive && !column.isAutoComputed && column.status !== activeOrderStatus
  const isInvalidDropTarget = isDragActive && column.isAutoComputed

  const accentClass = COLUMN_HEADER_ACCENT[column.status] ?? "border-t-border"
  const badgeClass = COLUMN_COUNT_BADGE[column.status] ?? "bg-muted text-muted-foreground"

  return (
    <div className="flex flex-col min-w-64 max-w-72 w-64 shrink-0">
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2.5 mb-2",
          "rounded-lg border border-border bg-card",
          "border-t-2",
          accentClass,
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {column.isAutoComputed && (
            <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          )}
          <span className="text-xs font-semibold text-foreground truncate">
            {column.label}
          </span>
        </div>
        <span
          className={cn(
            "ml-2 shrink-0 min-w-5 h-5 rounded-full px-1.5",
            "inline-flex items-center justify-center text-[10px] font-semibold tabular-nums",
            badgeClass,
          )}
        >
          {column.count}
        </span>
      </div>

      {/* Drop zone — outer div registers with dnd-kit */}
      <div
        ref={setDropRef}
        className={cn(
          "flex flex-col rounded-lg p-2 min-h-40 transition-colors duration-150",
          isOver && isValidDropTarget && "bg-primary/5 ring-1 ring-primary/30",
          isOver && isInvalidDropTarget && "bg-destructive/5 ring-1 ring-destructive/20",
          isDragActive && isValidDropTarget && !isOver && "bg-muted/30 ring-1 ring-border ring-dashed",
          isDragActive && isInvalidDropTarget && !isOver && "opacity-60",
        )}
      >
        {/* Drop hint */}
        {isDragActive && isValidDropTarget && (
          <div
            className={cn(
              "h-8 rounded-md border-2 border-dashed flex items-center justify-center",
              isOver ? "border-primary/50 bg-primary/5" : "border-border/50",
            )}
          >
            <span className="text-[10px] text-muted-foreground">
              {isOver ? "Thả vào đây" : ""}
            </span>
          </div>
        )}

        {/* Auto-computed hint */}
        {isDragActive && isInvalidDropTarget && (
          <div className="flex items-center justify-center h-8 gap-1.5 text-[10px] text-muted-foreground/60">
            <Lock className="h-3 w-3" />
            <span>Tự động</span>
          </div>
        )}

        {/* Virtual scroll container — inner div owns the scroll */}
        <div
          ref={scrollRef}
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100svh - 11rem)" }}
        >
          {column.orders.length === 0 && !isDragActive ? (
            <div className="flex items-center justify-center h-16 text-[11px] text-muted-foreground/50">
              Không có đơn
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const order = column.orders[virtualItem.index]
                return (
                  <div
                    key={order.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                      paddingBottom: `${CARD_GAP_PX}px`,
                    }}
                  >
                    <KanbanCard
                      order={order}
                      isDragDisabled={column.isAutoComputed || column.status === "COMPLETED"}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useCallback, useRef } from "react"
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addDays } from "date-fns"
import { vi } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  LayoutGrid,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CalendarOrderEvent } from "../../types/production.types"

// ─── date-fns localizer ────────────────────────────────────────────────────────

const locales = { vi }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: vi }),
  getDay,
  locales,
})

// ─── Status labels ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  NEW: "Mới",
  WAITING_FILES: "Chờ file",
  PARTIAL_DELIVERY: "Một phần",
  OVERDUE: "Trễ hạn",
  FILES_DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
}

// ─── ManagementUnit type ──────────────────────────────────────────────────────

interface ManagementUnit {
  id: string
  name: string
}

// ─── Event tooltip (floating div on hover) ───────────────────────────────────

interface EventTooltipProps {
  event: CalendarOrderEvent
  x: number
  y: number
}

function EventTooltip({ event, x, y }: EventTooltipProps) {
  const r = event.resource
  const progress =
    r.totalItemCount > 0
      ? Math.round((r.deliveredCount / r.totalItemCount) * 100)
      : 0

  return (
    <div
      className="fixed z-50 w-60 rounded-lg border border-border bg-card shadow-lg p-3 space-y-2 pointer-events-none"
      style={{ left: x + 12, top: y - 8 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-semibold">{r.orderNumber}</p>
          {r.customerName && (
            <p className="text-xs text-muted-foreground truncate">{r.customerName}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
            r.status === "OVERDUE" && "bg-destructive/20 text-destructive",
            r.status === "COMPLETED" && "bg-success/20 text-success-foreground",
            r.status === "FILES_DELIVERED" && "bg-success/20 text-success-foreground",
            r.status === "WAITING_FILES" && "bg-warning/20 text-warning-foreground",
            r.status === "PARTIAL_DELIVERY" && "bg-info/20 text-info-foreground",
            r.status === "NEW" && "bg-muted text-muted-foreground",
          )}
        >
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Giao file</span>
          <span className="font-medium tabular-nums">
            {r.deliveredCount}/{r.totalItemCount}
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              progress === 100
                ? "bg-success"
                : progress > 0
                  ? "bg-info"
                  : "bg-muted-foreground/40",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        {format(event.start, "dd/MM")} → {format(event.end, "dd/MM/yyyy")}
      </div>
    </div>
  )
}

// ─── Custom event component ───────────────────────────────────────────────────

function EventComponent({
  event,
  onHover,
  onLeave,
}: {
  event: CalendarOrderEvent
  onHover: (event: CalendarOrderEvent, x: number, y: number) => void
  onLeave: () => void
}) {
  const r = event.resource

  return (
    <div
      className="flex flex-col h-full px-1.5 py-0.5 cursor-pointer truncate"
      onMouseEnter={(e) => onHover(event, e.clientX, e.clientY)}
      onMouseLeave={onLeave}
    >
      <span className="text-[10px] font-semibold leading-tight truncate">
        {r.orderNumber}
      </span>
      {r.customerName && (
        <span className="text-[9px] leading-tight truncate opacity-80">
          {r.customerName}
        </span>
      )}
    </div>
  )
}

// ─── Wrapper with hover state ─────────────────────────────────────────────────

function EventWithHover(
  onHover: (event: CalendarOrderEvent, x: number, y: number) => void,
  onLeave: () => void,
) {
  return function EventWrapper({ event }: { event: CalendarOrderEvent }) {
    return (
      <EventComponent event={event} onHover={onHover} onLeave={onLeave} />
    )
  }
}

// ─── Custom toolbar ────────────────────────────────────────────────────────────

interface CustomToolbarProps {
  date: Date
  view: View
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void
  onView: (view: View) => void
  units: ManagementUnit[]
  unitId: string
  onUnitChange: (id: string) => void
  onRefresh: () => void
  isRefreshing: boolean
}

function CustomToolbar({
  date,
  view,
  onNavigate,
  onView,
  units,
  unitId,
  onUnitChange,
  onRefresh,
  isRefreshing,
}: CustomToolbarProps) {
  const label =
    view === "month"
      ? format(date, "MMMM yyyy", { locale: vi })
      : view === "week"
        ? `Tuần ${format(date, "w")} · ${format(date, "MMMM yyyy", { locale: vi })}`
        : `Agenda · ${format(date, "MMMM yyyy", { locale: vi })}`

  return (
    <div className="flex items-center gap-2 flex-wrap pb-3 mb-1 border-b border-border">
      {/* Nav */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-sm"
          onClick={() => onNavigate("TODAY")}
        >
          Hôm nay
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate("NEXT")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Label */}
      <h2 className="text-sm font-semibold capitalize flex-1 min-w-32">{label}</h2>

      {/* Unit filter */}
      {units.length > 0 && (
        <Select
          value={unitId}
          onChange={(e) => onUnitChange(e.target.value)}
          className="h-8 w-40 text-xs"
        >
          <option value="">Tất cả đơn vị</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      )}

      {/* View selector */}
      <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
        <Button
          variant={view === "month" ? "secondary" : "ghost"}
          size="icon"
          className="h-6 w-6"
          onClick={() => onView("month")}
          title="Tháng"
        >
          <LayoutGrid className="h-3 w-3" />
        </Button>
        <Button
          variant={view === "week" ? "secondary" : "ghost"}
          size="icon"
          className="h-6 w-6"
          onClick={() => onView("week")}
          title="Tuần"
        >
          <CalendarDays className="h-3 w-3" />
        </Button>
        <Button
          variant={view === "agenda" ? "secondary" : "ghost"}
          size="icon"
          className="h-6 w-6"
          onClick={() => onView("agenda")}
          title="Agenda"
        >
          <List className="h-3 w-3" />
        </Button>
      </div>

      {/* Refresh */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Làm mới"
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
        />
      </Button>
    </div>
  )
}

// ─── Priority legend ──────────────────────────────────────────────────────────

function CalendarLegend() {
  const items = [
    { color: "bg-muted-foreground/40", label: "Mới tạo" },
    { color: "bg-warning/60", label: "Chờ giao file" },
    { color: "bg-info/60", label: "Giao một phần" },
    { color: "bg-destructive/70", label: "Trễ hạn" },
    { color: "bg-success/60", label: "Đã giao file" },
    { color: "bg-primary/40", label: "Hoàn thành" },
  ]

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm shrink-0", item.color)} />
          <span className="text-[11px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface ProductionCalendarProps {
  initialEvents: CalendarOrderEvent[]
  units: ManagementUnit[]
}

export function ProductionCalendar({
  initialEvents,
  units,
}: ProductionCalendarProps) {
  const router = useRouter()
  const [view, setView] = useState<View>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [unitId, setUnitId] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tooltip, setTooltip] = useState<{
    event: CalendarOrderEvent
    x: number
    y: number
  } | null>(null)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    router.refresh()
    await new Promise((r) => setTimeout(r, 600))
    setIsRefreshing(false)
  }, [router])

  const handleHover = useCallback(
    (event: CalendarOrderEvent, x: number, y: number) => {
      setTooltip({ event, x, y })
    },
    [],
  )

  const handleLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  // Event style getter
  const eventPropGetter = useCallback((event: CalendarOrderEvent) => {
    const { status, priority } = event.resource
    let bg = "#71717A80" // muted default

    if (priority === "overdue" || status === "OVERDUE") bg = "#EF444480"
    else if (priority === "urgent") bg = "#F59E0B80"
    else if (status === "COMPLETED") bg = "#09090B60"
    else if (status === "FILES_DELIVERED") bg = "#10B98180"
    else if (status === "PARTIAL_DELIVERY") bg = "#3B82F680"
    else if (status === "WAITING_FILES") bg = "#F59E0B70"

    return {
      style: {
        backgroundColor: bg,
        border: "none",
        borderRadius: "6px",
        color: "#fff",
        fontSize: "11px",
      },
    }
  }, [])

  // Day prop getter — subtle today highlight
  const dayPropGetter = useCallback((date: Date) => {
    const today = new Date()
    const isToday =
      date.toDateString() === today.toDateString()
    return isToday
      ? { style: { backgroundColor: "hsl(var(--primary) / 0.04)" } }
      : {}
  }, [])

  // Memoized event component factory
  const EventWrapper = EventWithHover(handleHover, handleLeave)

  return (
    <div className="flex flex-col h-full relative">
      <style>{`
        .rbc-calendar { font-family: var(--font-sans); font-size: 13px; color: hsl(var(--foreground)); background: transparent; }
        .rbc-header { padding: 6px 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--muted-foreground)); border-color: hsl(var(--border)); background: transparent; }
        .rbc-month-view { border: 1px solid hsl(var(--border)); border-radius: 8px; overflow: hidden; }
        .rbc-day-bg { border-color: hsl(var(--border)); }
        .rbc-off-range-bg { background: hsl(var(--muted) / 0.3); }
        .rbc-date-cell { padding: 4px 6px; font-size: 11px; color: hsl(var(--muted-foreground)); }
        .rbc-date-cell.rbc-now { font-weight: 700; color: hsl(var(--foreground)); }
        .rbc-event { padding: 1px 2px; }
        .rbc-event:focus { outline: 2px solid hsl(var(--ring)); outline-offset: 1px; }
        .rbc-show-more { font-size: 11px; color: hsl(var(--primary)); font-weight: 500; background: transparent; padding: 1px 4px; }
        .rbc-agenda-table { border-color: hsl(var(--border)); width: 100%; }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell { font-size: 12px; color: hsl(var(--muted-foreground)); padding: 8px 12px; border-color: hsl(var(--border)); }
        .rbc-agenda-event-cell { padding: 8px 12px; border-color: hsl(var(--border)); }
        .rbc-toolbar { display: none; }
        .rbc-month-row + .rbc-month-row { border-color: hsl(var(--border)); }
        .rbc-time-content { border-color: hsl(var(--border)); }
        .rbc-time-header-content { border-color: hsl(var(--border)); }
        .rbc-time-view { border: 1px solid hsl(var(--border)); border-radius: 8px; overflow: hidden; }
        .rbc-agenda-view { border: 1px solid hsl(var(--border)); border-radius: 8px; overflow: hidden; }
        .rbc-current-time-indicator { background-color: hsl(var(--destructive)); }
        .rbc-week-view, .rbc-work-week-view { border: 1px solid hsl(var(--border)); border-radius: 8px; overflow: hidden; }
        .rbc-time-slot { border-color: hsl(var(--border) / 0.5); }
        .rbc-timeslot-group { border-color: hsl(var(--border)); }
        .rbc-day-slot .rbc-event { border: none; }
        .rbc-selected { box-shadow: 0 0 0 2px hsl(var(--ring)); }
        .rbc-today { background: transparent; }
      `}</style>

      {/* Custom toolbar */}
      <CustomToolbar
        date={currentDate}
        view={view}
        onNavigate={(action) => {
          if (action === "PREV") {
            if (view === "month")
              setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
            else if (view === "week") setCurrentDate((d) => addDays(d, -7))
            else setCurrentDate((d) => addDays(d, -30))
          } else if (action === "NEXT") {
            if (view === "month")
              setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
            else if (view === "week") setCurrentDate((d) => addDays(d, 7))
            else setCurrentDate((d) => addDays(d, 30))
          } else {
            setCurrentDate(new Date())
          }
        }}
        onView={setView}
        units={units}
        unitId={unitId}
        onUnitChange={setUnitId}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Calendar */}
      <div className="flex-1 min-h-0">
        <Calendar
          localizer={localizer}
          events={initialEvents}
          view={view}
          date={currentDate}
          onNavigate={setCurrentDate}
          onView={setView}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
          components={{
            event: EventWrapper as never,
            toolbar: () => null,
          }}
          popup
          style={{ height: "100%" }}
          messages={{
            allDay: "Cả ngày",
            previous: "Trước",
            next: "Sau",
            today: "Hôm nay",
            month: "Tháng",
            week: "Tuần",
            day: "Ngày",
            agenda: "Lịch",
            date: "Ngày",
            time: "Giờ",
            event: "Đơn hàng",
            showMore: (total: number) => `+${total} thêm`,
          }}
        />
      </div>

      {/* Legend */}
      <CalendarLegend />

      {/* Hover tooltip */}
      {tooltip && (
        <EventTooltip
          event={tooltip.event}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
    </div>
  )
}

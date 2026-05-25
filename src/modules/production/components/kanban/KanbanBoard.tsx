"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { useRouter } from "next/navigation"
import { KanbanColumn } from "./KanbanColumn"
import { KanbanCard } from "./KanbanCard"
import { KanbanFilters } from "./KanbanFilters"
import { KanbanMoveDialog } from "./KanbanMoveDialog"
import type {
  KanbanColumnMeta,
  KanbanOrder,
  KanbanTransitionInfo,
} from "../../types/production.types"
import { getTransitionInfo } from "../../utils/transition.utils"

interface ManagementUnit {
  id: string
  name: string
}

interface KanbanBoardProps {
  initialColumns: KanbanColumnMeta[]
  units: ManagementUnit[]
}

export function KanbanBoard({ initialColumns, units }: KanbanBoardProps) {
  const router = useRouter()

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [unitId, setUnitId] = useState("")
  const [includeCompleted, setIncludeCompleted] = useState(false)

  // ── Optimistic columns state ──────────────────────────────────────────────────
  const [columns, setColumns] = useState<KanbanColumnMeta[]>(initialColumns)

  // Sync with server data when initialColumns changes (after revalidatePath)
  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  // ── Auto-refresh every 60s ────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 60_000)
    return () => clearInterval(interval)
  }, [router])

  // ── Drag state ────────────────────────────────────────────────────────────────
  const [activeOrder, setActiveOrder] = useState<KanbanOrder | null>(null)
  const [pendingMove, setPendingMove] = useState<{
    order: KanbanOrder
    toStatus: string
    toStatusLabel: string
    transitionInfo: KanbanTransitionInfo
  } | null>(null)

  // Store the original column before drag for rollback
  const dragOriginStatus = useRef<string | null>(null)

  // ── DnD sensors ──────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  // ── Client-side filter ────────────────────────────────────────────────────────
  const filteredColumns = useMemo<KanbanColumnMeta[]>(() => {
    const q = search.toLowerCase().trim()
    return columns
      .filter((col) => includeCompleted || col.status !== "COMPLETED")
      .map((col) => ({
        ...col,
        orders: !q
          ? col.orders
          : col.orders.filter(
              (o) =>
                o.orderNumber.toLowerCase().includes(q) ||
                o.contactName.toLowerCase().includes(q) ||
                (o.customer?.name ?? "").toLowerCase().includes(q),
            ),
        count: !q
          ? col.count
          : col.orders.filter(
              (o) =>
                o.orderNumber.toLowerCase().includes(q) ||
                o.contactName.toLowerCase().includes(q) ||
                (o.customer?.name ?? "").toLowerCase().includes(q),
            ).length,
      }))
  }, [columns, search, includeCompleted])

  const totalOrders = useMemo(
    () => filteredColumns.reduce((acc, col) => acc + col.count, 0),
    [filteredColumns],
  )

  // ── Drag handlers ─────────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const { data } = event.active
    if (data?.current?.order) {
      setActiveOrder(data.current.order as KanbanOrder)
      dragOriginStatus.current = (data.current.order as KanbanOrder).status
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event
    setActiveOrder(null)

    if (!over || !active.data.current?.order) {
      dragOriginStatus.current = null
      return
    }

    const order = active.data.current.order as KanbanOrder
    const toStatus = over.id as string

    if (order.status === toStatus) {
      dragOriginStatus.current = null
      return
    }

    const toCol = columns.find((c) => c.status === toStatus)
    if (!toCol) {
      dragOriginStatus.current = null
      return
    }

    // Get transition info (client-side, no server call)
    const transitionInfo = getTransitionInfo(
      order.status,
      toStatus,
      order.isFullyPaid,
    )

    setPendingMove({
      order,
      toStatus,
      toStatusLabel: toCol.label,
      transitionInfo,
    })
    dragOriginStatus.current = null
  }

  // ── Optimistic move on dialog success ────────────────────────────────────────
  const handleMoveSuccess = useCallback((orderId: string, newStatus: string) => {
    setColumns((prev) => {
      let movedOrder: KanbanOrder | null = null

      // Remove from old column
      const next = prev.map((col) => {
        const filtered = col.orders.filter((o) => {
          if (o.id === orderId) {
            movedOrder = { ...o, status: newStatus }
            return false
          }
          return true
        })
        return { ...col, orders: filtered, count: filtered.length }
      })

      // Add to new column
      if (movedOrder) {
        return next.map((col) => {
          if (col.status === newStatus) {
            return {
              ...col,
              orders: [movedOrder!, ...col.orders],
              count: col.count + 1,
            }
          }
          return col
        })
      }

      return next
    })
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Filters */}
      <KanbanFilters
        units={units}
        search={search}
        unitId={unitId}
        includeCompleted={includeCompleted}
        totalOrders={totalOrders}
        onSearchChange={setSearch}
        onUnitChange={setUnitId}
        onIncludeCompletedChange={setIncludeCompleted}
      />

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1 items-start">
          {filteredColumns.map((col) => (
            <KanbanColumn
              key={col.status}
              column={col}
              isDragActive={activeOrder !== null}
              activeOrderStatus={activeOrder?.status}
            />
          ))}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeOrder && (
            <div className="opacity-90 rotate-1 scale-[1.02] shadow-2xl">
              <KanbanCard order={activeOrder} isDragDisabled />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Move confirmation dialog */}
      <KanbanMoveDialog
        open={pendingMove !== null}
        order={pendingMove?.order ?? null}
        toStatusLabel={pendingMove?.toStatusLabel ?? ""}
        transitionInfo={pendingMove?.transitionInfo ?? null}
        onClose={() => setPendingMove(null)}
        onSuccess={handleMoveSuccess}
      />
    </div>
  )
}

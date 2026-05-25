"use client"

import { useState, useCallback } from "react"
import { Search, LayoutGrid, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface ManagementUnit {
  id: string
  name: string
}

interface KanbanFiltersProps {
  units: ManagementUnit[]
  search: string
  unitId: string
  includeCompleted: boolean
  totalOrders: number
  onSearchChange: (value: string) => void
  onUnitChange: (value: string) => void
  onIncludeCompletedChange: (value: boolean) => void
}

export function KanbanFilters({
  units,
  search,
  unitId,
  includeCompleted,
  totalOrders,
  onSearchChange,
  onUnitChange,
  onIncludeCompletedChange,
}: KanbanFiltersProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    router.refresh()
    await new Promise((r) => setTimeout(r, 600))
    setIsRefreshing(false)
  }, [router])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-52 max-w-72">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Tìm mã đơn, khách hàng…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Unit filter */}
      <Select
        value={unitId}
        onChange={(e) => onUnitChange(e.target.value)}
        className="h-8 w-44 text-sm"
      >
        <option value="">Tất cả đơn vị</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </Select>

      {/* Include completed */}
      <Button
        variant={includeCompleted ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => onIncludeCompletedChange(!includeCompleted)}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {includeCompleted ? "Ẩn hoàn thành" : "Hiện hoàn thành"}
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Total */}
      <span className="text-xs text-muted-foreground tabular-nums">
        {totalOrders} đơn
      </span>

      {/* Refresh */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Làm mới"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}

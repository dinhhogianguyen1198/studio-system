"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { SerializedOrderSummary } from "../../types/orders.types"
import type { PaginationMeta } from "@/shared/types/api.types"
import { OrderStatusBadge } from "./OrderStatusBadge"

interface ManagementUnit {
  id: string
  name: string
}

interface Props {
  orders: SerializedOrderSummary[]
  meta: PaginationMeta
  managementUnits: ManagementUnit[]
}

const STATUS_FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "NEW", label: "Mới tạo" },
  { value: "WAITING_FILES,PARTIAL_DELIVERY", label: "Đang giao file" },
  { value: "OVERDUE", label: "Trễ hạn" },
  { value: "FILES_DELIVERED", label: "Đã giao file" },
  { value: "COMPLETED", label: "Hoàn thành" },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export function OrderTable({ orders, meta, managementUnits }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentStatus = searchParams.get("status") ?? ""
  const currentSearch = searchParams.get("search") ?? ""
  const currentManagementUnitId = searchParams.get("managementUnitId") ?? ""

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = searchInputRef.current?.value ?? ""
    navigate({ search: value, page: "" })
  }

  function clearSearch() {
    if (searchInputRef.current) searchInputRef.current.value = ""
    navigate({ search: "", page: "" })
  }

  const hasActiveFilters = currentSearch || currentManagementUnitId

  // Tạo dãy trang để hiển thị
  function getPageNumbers(): (number | "…")[] {
    const { page, totalPages } = meta
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | "…")[] = [1]
    if (page > 3) pages.push("…")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push("…")
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="space-y-3">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => navigate({ status: f.value, page: "" })}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              currentStatus === f.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            defaultValue={currentSearch}
            placeholder="Tìm mã đơn, khách hàng, tên tiệc..."
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Đơn vị quản lý */}
        {managementUnits.length > 0 && (
          <select
            value={currentManagementUnitId}
            onChange={(e) => navigate({ managementUnitId: e.target.value, page: "" })}
            className="h-8 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="">Tất cả đơn vị</option>
            {managementUnits.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => navigate({ search: "", managementUnitId: "", page: "" })}
            className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Xóa bộ lọc
          </button>
        )}

        {/* Tổng số */}
        <span className="ml-auto text-xs text-muted-foreground shrink-0">
          {meta.total} đơn hàng
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border py-12 text-center text-sm">
          Không tìm thấy đơn hàng nào.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-36">Đơn hàng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Tên tiệc</TableHead>
                  {managementUnits.length > 0 && (
                    <TableHead className="w-36">Đơn vị QL</TableHead>
                  )}
                  <TableHead className="w-16 text-center">DV</TableHead>
                  <TableHead className="w-44">Tài chính</TableHead>
                  <TableHead className="w-36">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const debt = Number(order.totalAmount) - Number(order.paidAmount)
                  const isOverdue = order.status === "OVERDUE"
                  const paidPercent =
                    Number(order.totalAmount) > 0
                      ? Math.min(100, (Number(order.paidAmount) / Number(order.totalAmount)) * 100)
                      : 0

                  return (
                    <TableRow
                      key={order.id}
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isOverdue && "bg-destructive/5 hover:bg-destructive/10",
                      )}
                    >
                      {/* Số đơn + ngày */}
                      <TableCell>
                        <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: vi })}
                        </p>
                      </TableCell>

                      {/* Khách hàng */}
                      <TableCell>
                        <p className="font-medium text-sm">
                          {order.customer?.name ?? order.contactName}
                        </p>
                        {order.contactPhone && (
                          <p className="text-xs text-muted-foreground">{order.contactPhone}</p>
                        )}
                      </TableCell>

                      {/* Tên tiệc */}
                      <TableCell>
                        {order.partyName ? (
                          <p className="text-sm">{order.partyName}</p>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>

                      {/* Đơn vị quản lý */}
                      {managementUnits.length > 0 && (
                        <TableCell>
                          {order.orderManagementUnit ? (
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {order.orderManagementUnit.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                      )}

                      {/* Số dịch vụ */}
                      <TableCell className="text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {order._count.items}
                        </span>
                      </TableCell>

                      {/* Tài chính */}
                      <TableCell>
                        <p className="tabular-nums text-sm font-medium">
                          {Number(order.totalAmount).toLocaleString("vi-VN")}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">₫</span>
                        </p>
                        {Number(order.totalAmount) > 0 && (
                          <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-success-foreground/70 transition-all"
                              style={{ width: `${paidPercent}%` }}
                            />
                          </div>
                        )}
                        {debt > 0 ? (
                          <p className="text-xs text-warning-foreground tabular-nums mt-0.5">
                            Còn {debt.toLocaleString("vi-VN")} ₫
                          </p>
                        ) : Number(order.totalAmount) > 0 ? (
                          <p className="text-xs text-success-foreground mt-0.5">Đã thanh toán đủ</p>
                        ) : null}
                      </TableCell>

                      {/* Trạng thái */}
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground shrink-0">
                {(meta.page - 1) * meta.pageSize + 1}–
                {Math.min(meta.page * meta.pageSize, meta.total)} / {meta.total}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  disabled={meta.page <= 1}
                  onClick={() => navigate({ page: String(meta.page - 1) })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === meta.page ? "default" : "outline"}
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => navigate({ page: String(p) })}
                    >
                      {p}
                    </Button>
                  ),
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => navigate({ page: String(meta.page + 1) })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Page size */}
              <select
                value={meta.pageSize}
                onChange={(e) => navigate({ page: "1", pageSize: e.target.value })}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground focus:border-ring focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s} / trang</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  )
}

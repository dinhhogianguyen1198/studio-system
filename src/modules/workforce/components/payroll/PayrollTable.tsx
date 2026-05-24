"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Banknote, ExternalLink, X } from "lucide-react"
import { markAssignmentAsPaidAction } from "@/modules/workforce/actions/worker-assignment.actions"
import type { SerializedOrderItemWorkerDetail } from "@/modules/workforce/types/workforce.types"

type PayFilter = "ALL" | "UNPAID" | "PAID"

interface Props {
  assignments: SerializedOrderItemWorkerDetail[]
}

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

// ── Hàng bảng ────────────────────────────────────────────────────────────────

function PayRow({ assignment }: { assignment: SerializedOrderItemWorkerDetail }) {
  const [isPending, startTransition] = useTransition()
  const isPaid = !!assignment.paidAt

  function handleMarkPaid() {
    startTransition(async () => {
      const result = await markAssignmentAsPaidAction(assignment.id)
      if (result.success) {
        toast.success("Đã đánh dấu thanh toán")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{assignment.worker.name}</TableCell>
      <TableCell className="text-muted-foreground">{assignment.jobTypeNameSnapshot}</TableCell>
      <TableCell>
        <Link
          href={`/dashboard/orders/${assignment.orderItem.order.id}`}
          className="inline-flex items-center gap-1 font-mono text-xs font-medium text-foreground hover:text-primary hover:underline"
        >
          {assignment.orderItem.order.orderNumber}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Link>
        <p className="mt-0.5 max-w-40 truncate text-xs text-muted-foreground">
          {assignment.orderItem.name}
        </p>
      </TableCell>
      <TableCell className="font-semibold tabular-nums">{fmt(assignment.totalCost)}</TableCell>
      <TableCell>
        {isPaid ? (
          <div className="flex items-center gap-1.5">
            <Badge variant="success">Đã thanh toán</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(assignment.paidAt as string).toLocaleDateString("vi-VN")}
            </span>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkPaid}
            disabled={isPending}
            className="h-7 text-xs"
          >
            <Banknote className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? "Đang xử lý..." : "Đánh dấu đã TT"}
          </Button>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(assignment.createdAt).toLocaleDateString("vi-VN")}
      </TableCell>
    </TableRow>
  )
}

// ── Bảng chính + bộ lọc ──────────────────────────────────────────────────────

export function PayrollTable({ assignments }: Props) {
  // Payment status tab
  const [payFilter, setPayFilter] = useState<PayFilter>("ALL")

  // Bộ lọc chi tiết
  const [workerFilter, setWorkerFilter] = useState("")
  const [orderFilter, setOrderFilter] = useState("")
  const [jobTypeFilter, setJobTypeFilter] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Derive unique options từ data
  const workerOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of assignments) map.set(a.worker.id, a.worker.name)
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [assignments])

  const orderOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of assignments) map.set(a.orderItem.order.id, a.orderItem.order.orderNumber)
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [assignments])

  const jobTypeOptions = useMemo(() => {
    return [...new Set(assignments.map((a) => a.jobTypeNameSnapshot))].sort()
  }, [assignments])

  // Áp dụng bộ lọc
  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (payFilter === "UNPAID" && a.paidAt) return false
      if (payFilter === "PAID" && !a.paidAt) return false
      if (workerFilter && a.worker.id !== workerFilter) return false
      if (orderFilter && a.orderItem.order.id !== orderFilter) return false
      if (jobTypeFilter && a.jobTypeNameSnapshot !== jobTypeFilter) return false
      if (minAmount && a.totalCost < Number(minAmount)) return false
      if (maxAmount && a.totalCost > Number(maxAmount)) return false
      if (dateFrom && new Date(a.createdAt) < new Date(dateFrom)) return false
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(a.createdAt) > to) return false
      }
      return true
    })
  }, [assignments, payFilter, workerFilter, orderFilter, jobTypeFilter, minAmount, maxAmount, dateFrom, dateTo])

  const hasActiveFilters =
    workerFilter || orderFilter || jobTypeFilter || minAmount || maxAmount || dateFrom || dateTo

  function clearFilters() {
    setWorkerFilter("")
    setOrderFilter("")
    setJobTypeFilter("")
    setMinAmount("")
    setMaxAmount("")
    setDateFrom("")
    setDateTo("")
  }

  const unpaidCount = assignments.filter((a) => !a.paidAt).length
  const paidCount = assignments.filter((a) => !!a.paidAt).length

  const payFilterTabs: { key: PayFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Tất cả", count: assignments.length },
    { key: "UNPAID", label: "Chưa thanh toán", count: unpaidCount },
    { key: "PAID", label: "Đã thanh toán", count: paidCount },
  ]

  return (
    <div>
      {/* Bộ lọc chi tiết */}
      <div className="space-y-3 border-b border-border px-4 pb-4 pt-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {/* Nhân viên */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Nhân viên</p>
            <Select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="h-8 text-xs"
            >
              <option value="">Tất cả</option>
              {workerOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </Select>
          </div>

          {/* Đơn hàng */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Đơn hàng</p>
            <Select
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              className="h-8 text-xs"
            >
              <option value="">Tất cả</option>
              {orderOptions.map(([id, num]) => (
                <option key={id} value={id}>{num}</option>
              ))}
            </Select>
          </div>

          {/* Vai trò */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Vai trò</p>
            <Select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="h-8 text-xs"
            >
              <option value="">Tất cả</option>
              {jobTypeOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </div>

          {/* Ngày từ */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Từ ngày</p>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Ngày đến */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Đến ngày</p>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Chi phí tối thiểu */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Chi phí từ (VND)</p>
            <Input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="h-8 text-xs"
              min={0}
            />
          </div>

          {/* Chi phí tối đa */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Chi phí đến (VND)</p>
            <Input
              type="number"
              placeholder="∞"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="h-8 text-xs"
              min={0}
            />
          </div>

          {/* Nút xóa lọc */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs text-muted-foreground"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Xóa lọc
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Payment status tabs */}
      <div className="flex gap-1 border-b border-border px-4 pt-3">
        {payFilterTabs.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setPayFilter(f.key)}
            className={`flex items-center gap-1.5 rounded-t-md px-3 py-2 text-xs font-medium transition-colors ${
              payFilter === f.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                payFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Kết quả */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Không có phân công nào</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Chi phí</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <PayRow key={a.id} assignment={a} />
            ))}
          </TableBody>
        </Table>
      )}

      {filtered.length > 0 && (
        <p className="border-t border-border px-4 py-2 text-right text-xs text-muted-foreground">
          {filtered.length} phân công ·{" "}
          {fmt(filtered.reduce((s, a) => s + a.totalCost, 0))}
        </p>
      )}
    </div>
  )
}

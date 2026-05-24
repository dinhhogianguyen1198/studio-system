"use client"

import { useTransition, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Banknote, ExternalLink, ChevronRight } from "lucide-react"
import { markAssignmentAsPaidAction } from "@/modules/workforce/actions/worker-assignment.actions"
import type {
  WorkerPayrollSummary,
  SerializedOrderItemWorkerDetail,
} from "@/modules/workforce/types/workforce.types"

interface Props {
  summary: WorkerPayrollSummary
}

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

// ── Row thanh toán một phân công ────────────────────────────────────────────

function AssignmentPayRow({ assignment }: { assignment: SerializedOrderItemWorkerDetail }) {
  const [isPending, startTransition] = useTransition()

  function handlePay() {
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
    <div className="flex items-center justify-between py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{assignment.orderItem.name}</p>
        <p className="text-xs text-muted-foreground">{assignment.jobTypeNameSnapshot}</p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        <span className="tabular-nums text-sm font-semibold">{fmt(assignment.totalCost)}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePay}
          disabled={isPending}
          className="h-7 text-xs"
        >
          <Banknote className="mr-1 h-3.5 w-3.5" />
          {isPending ? "..." : "Thanh toán"}
        </Button>
      </div>
    </div>
  )
}

// ── Dialog chi tiết phân công theo nhân viên ─────────────────────────────────

function WorkerAssignmentsDialog({ summary }: { summary: WorkerPayrollSummary }) {
  // Nhóm assignments theo đơn hàng
  const byOrder = new Map<
    string,
    { orderId: string; orderNumber: string; assignments: SerializedOrderItemWorkerDetail[] }
  >()
  for (const a of summary.assignments) {
    const orderId = a.orderItem.order.id
    if (!byOrder.has(orderId)) {
      byOrder.set(orderId, { orderId, orderNumber: a.orderItem.order.orderNumber, assignments: [] })
    }
    byOrder.get(orderId)!.assignments.push(a)
  }
  const orders = Array.from(byOrder.values())

  const initials = summary.workerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={summary.workerAvatarUrl ?? undefined} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle>{summary.workerName}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {summary.unpaidCount} phân công ·{" "}
              <span className="font-medium text-warning-foreground">
                {fmt(summary.unpaidAmount)}
              </span>{" "}
              chưa thanh toán
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="mt-2 space-y-4">
        {orders.map(({ orderId, orderNumber, assignments }) => {
          const orderTotal = assignments.reduce((s, a) => s + a.totalCost, 0)
          return (
            <div key={orderId} className="rounded-lg border border-border">
              {/* Order header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <Link
                  href={`/dashboard/orders/${orderId}`}
                  className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {orderNumber}
                  <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                </Link>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {fmt(orderTotal)}
                </span>
              </div>
              {/* Assignments trong đơn */}
              <div className="divide-y divide-border px-4">
                {assignments.map((a) => (
                  <AssignmentPayRow key={a.id} assignment={a} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </DialogContent>
  )
}

// ── Card chính ───────────────────────────────────────────────────────────────

export function WorkerPayrollCard({ summary }: Props) {
  const [open, setOpen] = useState(false)

  const initials = summary.workerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={summary.workerAvatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{summary.workerName}</p>
              <p className="text-xs text-muted-foreground">
                {summary.unpaidCount} phân công ·{" "}
                <span className="font-medium text-warning-foreground">
                  {fmt(summary.unpaidAmount)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-xs">Chưa thanh toán</Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </DialogTrigger>

      <WorkerAssignmentsDialog summary={summary} />
    </Dialog>
  )
}

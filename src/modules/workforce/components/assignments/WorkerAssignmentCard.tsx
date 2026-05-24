"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trash2, Banknote } from "lucide-react"
import {
  removeAssignmentAction,
  markAssignmentAsPaidAction,
} from "@/modules/workforce/actions/worker-assignment.actions"
import {
  RATE_TYPE_LABELS,
  type SerializedOrderItemWorkerDetail,
} from "@/modules/workforce/types/workforce.types"

interface Props {
  assignment: SerializedOrderItemWorkerDetail
  orderCancelled?: boolean
}

export function WorkerAssignmentCard({ assignment, orderCancelled = false }: Props) {
  const [isPending, startTransition] = useTransition()

  const initials = assignment.worker.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)

  const rateLabel = RATE_TYPE_LABELS[assignment.rateTypeSnapshot as keyof typeof RATE_TYPE_LABELS]

  const isPaid = !!assignment.paidAt

  const showDeleteButton = !isPaid && !orderCancelled
  const showPayButton = !isPaid && !orderCancelled

  function handleRemove() {
    startTransition(async () => {
      const result = await removeAssignmentAction(assignment.id)
      if (result.success) {
        toast.success("Đã xóa phân công")
      } else {
        toast.error(result.error)
      }
    })
  }

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
    <div className="flex flex-col rounded-lg border border-border bg-card p-3 gap-2.5">
      {/* Avatar + tên */}
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={assignment.worker.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {assignment.worker.name}
          </p>
          <p className="truncate text-xs text-muted-foreground leading-tight">
            {assignment.jobTypeNameSnapshot}
          </p>
        </div>
        {isPaid && (
          <Badge variant="success" className="shrink-0 text-[10px]">
            Đã TT
          </Badge>
        )}
      </div>

      {/* Chi phí + hành động */}
      <div className="flex items-end justify-between border-t border-border pt-2">
        <div>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {fmt(assignment.totalCost)}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {Number(assignment.quantity)} × {fmt(Number(assignment.rateAmountSnapshot))}/
            {rateLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {showPayButton && (
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={isPending}
              title="Đánh dấu đã thanh toán"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-success/10 hover:text-success-foreground disabled:opacity-50"
            >
              <Banknote className="h-3.5 w-3.5" />
            </button>
          )}
          {showDeleteButton && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              title="Xóa phân công"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

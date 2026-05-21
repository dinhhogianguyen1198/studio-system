"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trash2 } from "lucide-react"
import { removeAssignmentAction } from "@/modules/workforce/actions/worker-assignment.actions"
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

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={assignment.worker.avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{assignment.worker.name}</p>
        <p className="text-xs text-muted-foreground">{assignment.jobTypeNameSnapshot}</p>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {fmt(assignment.totalCost)}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {Number(assignment.quantity)} × {fmt(Number(assignment.rateAmountSnapshot))} /{" "}
          {rateLabel}
        </p>
      </div>

      {!orderCancelled && !assignment.paidAt && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

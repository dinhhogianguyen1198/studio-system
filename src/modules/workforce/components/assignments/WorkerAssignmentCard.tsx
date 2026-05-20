"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

  const formatCurrency = (amount: unknown) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount))

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
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={assignment.worker.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{assignment.worker.name}</p>
              <p className="text-xs text-muted-foreground">{assignment.jobTypeNameSnapshot}</p>
            </div>
          </div>
          {!orderCancelled && !assignment.paidAt && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
              disabled={isPending}
              onClick={handleRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Mức lương</p>
            <p className="font-medium">
              {formatCurrency(assignment.rateAmountSnapshot)} /{" "}
              {RATE_TYPE_LABELS[assignment.rateTypeSnapshot as keyof typeof RATE_TYPE_LABELS]}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Số lượng × Đơn giá</p>
            <p className="font-medium">
              {Number(assignment.quantity)} × {formatCurrency(assignment.rateAmountSnapshot)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs">Tổng chi phí</p>
            <p className="font-semibold text-base">{formatCurrency(assignment.totalCost)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

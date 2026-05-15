"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Trash2 } from "lucide-react"
import { AssignmentStatusBadge } from "./AssignmentStatusBadge"
import {
  updateAssignmentStatusAction,
  removeAssignmentAction,
} from "@/modules/workforce/actions/worker-assignment.actions"
import {
  RATE_TYPE_LABELS,
  type SerializedOrderItemWorkerDetail,
  type WorkerAssignmentStatus,
} from "@/modules/workforce/types/workforce.types"

interface Props {
  assignment: SerializedOrderItemWorkerDetail
}

const STATUS_TRANSITIONS: Record<string, { value: WorkerAssignmentStatus; label: string }[]> = {
  ASSIGNED: [
    { value: "IN_PROGRESS", label: "Bắt đầu thực hiện" },
    { value: "CANCELLED", label: "Hủy phân công" },
  ],
  IN_PROGRESS: [
    { value: "COMPLETED", label: "Đánh dấu hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
  ],
  COMPLETED: [],
  CANCELLED: [],
}

export function WorkerAssignmentCard({ assignment }: Props) {
  const [isPending, startTransition] = useTransition()

  const initials = assignment.worker.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const formatCurrency = (amount: unknown) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount))

  function handleStatusChange(newStatus: WorkerAssignmentStatus) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set("id", assignment.id)
      fd.set("status", newStatus)
      const result = await updateAssignmentStatusAction({ success: false, error: "" }, fd)
      if (result.success) {
        toast.success("Đã cập nhật trạng thái")
      } else {
        toast.error(result.error)
      }
    })
  }

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

  const transitions = STATUS_TRANSITIONS[assignment.status] ?? []

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
          <AssignmentStatusBadge status={assignment.status as WorkerAssignmentStatus} />
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

        {(transitions.length > 0 || assignment.status === "ASSIGNED") && (
          <div className="mt-3 flex items-center gap-2">
            {transitions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isPending} className="flex-1">
                    Cập nhật trạng thái
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {transitions.map((t) => (
                    <DropdownMenuItem key={t.value} onClick={() => handleStatusChange(t.value)}>
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {assignment.status === "ASSIGNED" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                disabled={isPending}
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

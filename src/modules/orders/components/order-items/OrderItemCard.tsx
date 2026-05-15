"use client"

import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { SerializedOrderItemSummary } from "../../types/orders.types"
import { removeOrderItemAction } from "../../actions/order-item.actions"
import { WorkflowStepTransitionButtons } from "@/modules/workflow/components/WorkflowStepTransitionButtons"
import type React from "react"

interface Transition {
  id: string
  toStepId: string
  label: string | null
  requireNote: boolean
  toStep: { id: string; key: string; name: string; color: string | null; isFinal: boolean }
}

interface Props {
  item: SerializedOrderItemSummary
  orderId: string
  availableTransitions: Transition[]
  workflowTimeline: React.ReactNode
}

export function OrderItemCard({
  item,
  orderId,
  availableTransitions,
  workflowTimeline,
}: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleDelete() {
    setIsPending(true)
    const result = await removeOrderItemAction(item.id, orderId)
    setIsPending(false)
    if (result.success) {
      toast.success(`Đã xóa dịch vụ "${item.name}"`)
      setDeleteOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{item.name}</p>
              <Badge variant="outline" className="text-xs">
                {item.serviceDefinition.name}
              </Badge>
            </div>
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <span>
                {Number(item.price).toLocaleString("vi-VN")} × {item.quantity} ={" "}
                <strong>{Number(item.totalPrice).toLocaleString("vi-VN")} VND</strong>
              </span>
              {item.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(item.deadline), "dd/MM/yyyy HH:mm", { locale: vi })}
                </span>
              )}
              {item.assignedTo && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.assignedTo.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item.currentStep && (
              <Badge variant="outline">{item.currentStep.name}</Badge>
            )}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Xóa dịch vụ khỏi đơn</DialogTitle>
                  <DialogDescription>
                    Bạn có chắc muốn xóa <strong>{item.name}</strong> khỏi đơn hàng?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                    {isPending ? "Đang xóa..." : "Xóa"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {item.notes && <p className="text-muted-foreground text-sm">{item.notes}</p>}

        {availableTransitions.length > 0 && (
          <WorkflowStepTransitionButtons
            orderItemId={item.id}
            orderId={orderId}
            transitions={availableTransitions}
          />
        )}

        {workflowTimeline}
      </CardContent>
    </Card>
  )
}

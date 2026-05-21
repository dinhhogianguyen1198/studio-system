"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar, CalendarCheck, CheckCheck, MapPin, RotateCcw, Trash2, User } from "lucide-react"
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
import { removeOrderItemAction, updateOrderItemDeliveryStatusAction } from "../../actions/order-item.actions"
import { EditOrderItemDialog } from "./EditOrderItemDialog"
import { OrderItemDeliveryBadge } from "./OrderItemDeliveryBadge"
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
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [isDeliveryPending, startDeliveryTransition] = useTransition()

  async function handleDelete() {
    setIsDeletePending(true)
    const result = await removeOrderItemAction(item.id, orderId)
    setIsDeletePending(false)
    if (result.success) {
      toast.success(`Đã xóa dịch vụ "${item.name}"`)
      setDeleteOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  function handleToggleDelivery() {
    const next = item.deliveryStatus === "DELIVERED" ? "PENDING" : "DELIVERED"
    startDeliveryTransition(async () => {
      const result = await updateOrderItemDeliveryStatusAction(item.id, orderId, next)
      if (result.success) {
        toast.success(
          next === "DELIVERED" ? "Đã đánh dấu giao file" : "Đã hoàn tác trạng thái giao file",
        )
      } else {
        toast.error(result.error)
      }
    })
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
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-foreground">
                {Number(item.price).toLocaleString("vi-VN")} ₫
              </span>
              {item.eventDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(item.eventDate), "dd/MM/yyyy", { locale: vi })}
                </span>
              )}
              {item.deadline && (
                <span className="flex items-center gap-1">
                  <CalendarCheck className="h-3 w-3" />
                  {format(new Date(item.deadline), "dd/MM/yyyy", { locale: vi })}
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
            <EditOrderItemDialog item={item} orderId={orderId} />
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
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeletePending}>
                    {isDeletePending ? "Đang xóa..." : "Xóa"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Delivery status row */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Giao file:</span>
            <OrderItemDeliveryBadge
              deliveryStatus={item.deliveryStatus}
              deadline={item.deadline}
            />
          </div>
          <Button
            size="sm"
            variant={item.deliveryStatus === "DELIVERED" ? "outline" : "default"}
            disabled={isDeliveryPending}
            onClick={handleToggleDelivery}
            className="h-7 px-3 text-xs"
          >
            {item.deliveryStatus === "DELIVERED" ? (
              <>
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Hoàn tác
              </>
            ) : (
              <>
                <CheckCheck className="mr-1.5 h-3 w-3" />
                Đánh dấu đã giao
              </>
            )}
          </Button>
        </div>

        {item.location && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {item.location}
          </p>
        )}
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

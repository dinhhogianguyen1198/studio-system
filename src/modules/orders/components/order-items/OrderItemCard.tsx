"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Calendar,
  CalendarCheck,
  CheckCheck,
  MapPin,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface Props {
  item: SerializedOrderItemSummary
  orderId: string
}

export function OrderItemCard({ item, orderId }: Props) {
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
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-2">
      {/* Row 1: tên + badges + actions */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm flex-1 min-w-0 truncate">{item.name}</span>

        <div className="flex items-center gap-1.5 shrink-0">
          <OrderItemDeliveryBadge deliveryStatus={item.deliveryStatus} deadline={item.deadline} />

          <Button
            size="sm"
            variant="ghost"
            disabled={isDeliveryPending}
            onClick={handleToggleDelivery}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            title={item.deliveryStatus === "DELIVERED" ? "Hoàn tác giao file" : "Đánh dấu đã giao"}
          >
            {item.deliveryStatus === "DELIVERED"
              ? <RotateCcw className="h-3.5 w-3.5" />
              : <CheckCheck className="h-3.5 w-3.5" />}
          </Button>

          <EditOrderItemDialog item={item} orderId={orderId} />

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
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

      {/* Row 2: metadata */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">
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
        {item.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.location}
          </span>
        )}
      </div>

      {item.notes && (
        <p className="text-xs text-muted-foreground">{item.notes}</p>
      )}

    </div>
  )
}

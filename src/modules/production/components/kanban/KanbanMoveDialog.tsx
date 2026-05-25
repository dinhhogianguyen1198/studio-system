"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { moveOrderAction } from "../../actions/production.actions"
import type { KanbanOrder, KanbanTransitionInfo } from "../../types/production.types"
import { toast } from "sonner"

interface KanbanMoveDialogProps {
  open: boolean
  order: KanbanOrder | null
  toStatusLabel: string
  transitionInfo: KanbanTransitionInfo | null
  onClose: () => void
  onSuccess: (orderId: string, newStatus: string) => void
}

export function KanbanMoveDialog({
  open,
  order,
  toStatusLabel,
  transitionInfo,
  onClose,
  onSuccess,
}: KanbanMoveDialogProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    if (!order || !transitionInfo || !transitionInfo.canDrop) return

    startTransition(async () => {
      const result = await moveOrderAction(order.id, "", transitionInfo.type)
      if (result.success) {
        toast.success(`Đã cập nhật ${order.orderNumber}`)
        onSuccess(order.id, result.data.newStatus)
        onClose()
      } else {
        toast.error(result.error)
        onClose()
      }
    })
  }

  if (!order || !transitionInfo) return null

  const isBlocked = !transitionInfo.canDrop
  const Icon = isBlocked ? Lock : transitionInfo.warning ? AlertTriangle : CheckCircle2

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon
              className={`h-4 w-4 ${
                isBlocked
                  ? "text-muted-foreground"
                  : transitionInfo.warning
                    ? "text-warning-foreground"
                    : "text-success-foreground"
              }`}
            />
            {isBlocked ? "Không thể thực hiện" : `Chuyển sang "${toStatusLabel}"`}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{order.orderNumber}</span>
            {" · "}
            {order.customer?.name ?? order.contactName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-foreground">{transitionInfo.description}</p>

          {transitionInfo.warning && (
            <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-warning-foreground">{transitionInfo.warning}</p>
            </div>
          )}

          {!isBlocked && (
            <div className="rounded-md bg-muted/60 border border-border px-3 py-2 space-y-1">
              <p className="text-xs text-muted-foreground">Thống kê đơn</p>
              <div className="flex gap-4 text-xs">
                <span>
                  <span className="font-medium">{order.deliveredCount}</span>
                  <span className="text-muted-foreground">/{order.totalItemCount} items đã giao</span>
                </span>
                <span>
                  <span className="font-medium">
                    {((order.paidAmount / (order.totalAmount || 1)) * 100).toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground"> đã thanh toán</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            {isBlocked ? "Đóng" : "Hủy"}
          </Button>
          {!isBlocked && (
            <Button size="sm" onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {transitionInfo.actionLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

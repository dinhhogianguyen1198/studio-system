"use client"

import { useState, useActionState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"
import type { SerializedOrderIncidentalCostSummary } from "../../types/orders.types"
import {
  createIncidentalCostAction,
  updateIncidentalCostAction,
  deleteIncidentalCostAction,
} from "../../actions/order-item.actions"

interface Props {
  orderId: string
  costs: SerializedOrderIncidentalCostSummary[]
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
const labelClass = "block text-sm font-medium"

function AddIncidentalCostDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const initialState: ActionResult<void> = { success: false, error: "" }
  const [state, formAction, isPending] = useActionState(createIncidentalCostAction, initialState)

  const [reason, setReason] = useState("")
  const [amountRaw, setAmountRaw] = useState(0)
  const [amountDisplay, setAmountDisplay] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã thêm chi phí phát sinh")
      setOpen(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  function handleOpenChange(next: boolean) {
    if (next) {
      setReason("")
      setAmountRaw(0)
      setAmountDisplay("")
      setNotes("")
    }
    setOpen(next)
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "")
    const num = digits ? parseInt(digits, 10) : 0
    setAmountRaw(num)
    setAmountDisplay(num > 0 ? num.toLocaleString("vi-VN") : "")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs">
          <Plus className="h-3 w-3" />
          Thêm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chi phí phát sinh</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="amount" value={amountRaw || ""} />
          <div className="space-y-1.5">
            <label htmlFor="ic-add-reason" className={labelClass}>
              Tên chi phí <span className="text-destructive">*</span>
            </label>
            <input
              id="ic-add-reason"
              name="reason"
              placeholder="VD: Phí vận chuyển, phí in ấn thêm..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ic-add-amount" className={labelClass}>
              Số tiền (VND) <span className="text-destructive">*</span>
            </label>
            <input
              id="ic-add-amount"
              type="text"
              inputMode="numeric"
              placeholder="500.000"
              value={amountDisplay}
              onChange={handleAmountChange}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ic-add-notes" className={labelClass}>Ghi chú</label>
            <Textarea
              id="ic-add-notes"
              name="notes"
              rows={2}
              placeholder="Chi tiết thêm về chi phí này..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Đang lưu..." : "Thêm"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditIncidentalCostDialog({
  cost,
  orderId,
}: {
  cost: SerializedOrderIncidentalCostSummary
  orderId: string
}) {
  const [open, setOpen] = useState(false)
  const boundAction = updateIncidentalCostAction.bind(null, cost.id, orderId)
  const initialState: ActionResult<void> = { success: false, error: "" }
  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  const [reason, setReason] = useState(cost.reason)
  const [amountRaw, setAmountRaw] = useState(cost.amount)
  const [amountDisplay, setAmountDisplay] = useState(
    cost.amount > 0 ? cost.amount.toLocaleString("vi-VN") : "",
  )
  const [notes, setNotes] = useState(cost.notes ?? "")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã cập nhật chi phí")
      setOpen(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "")
    const num = digits ? parseInt(digits, 10) : 0
    setAmountRaw(num)
    setAmountDisplay(num > 0 ? num.toLocaleString("vi-VN") : "")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa chi phí phát sinh</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="amount" value={amountRaw || ""} />
          <div className="space-y-1.5">
            <label htmlFor={`ic-edit-reason-${cost.id}`} className={labelClass}>
              Tên chi phí <span className="text-destructive">*</span>
            </label>
            <input
              id={`ic-edit-reason-${cost.id}`}
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`ic-edit-amount-${cost.id}`} className={labelClass}>
              Số tiền (VND) <span className="text-destructive">*</span>
            </label>
            <input
              id={`ic-edit-amount-${cost.id}`}
              type="text"
              inputMode="numeric"
              placeholder="500.000"
              value={amountDisplay}
              onChange={handleAmountChange}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`ic-edit-notes-${cost.id}`} className={labelClass}>Ghi chú</label>
            <Textarea
              id={`ic-edit-notes-${cost.id}`}
              name="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteIncidentalCostButton({
  cost,
  orderId,
}: {
  cost: SerializedOrderIncidentalCostSummary
  orderId: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteIncidentalCostAction(cost.id, orderId)
      if (result.success) {
        toast.success("Đã xóa chi phí")
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Xóa chi phí phát sinh</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa <strong>{cost.reason}</strong> —{" "}
            <strong>{cost.amount.toLocaleString("vi-VN")} ₫</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function IncidentalCostsCard({ orderId, costs }: Props) {
  const total = costs.reduce((sum, c) => sum + c.amount, 0)
  const fmt = (n: number) => n.toLocaleString("vi-VN")

  return (
    <Card>
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Chi phí phát sinh
            {costs.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {fmt(total)} ₫
              </span>
            )}
          </CardTitle>
          <AddIncidentalCostDialog orderId={orderId} />
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-3">
        {costs.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Chưa có chi phí phát sinh.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            {costs.map((cost, idx) => (
              <div key={cost.id}>
                {idx > 0 && <Separator className="mb-2" />}
                <div className="flex items-start gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{cost.reason}</span>
                      <span className="tabular-nums font-medium">{fmt(cost.amount)} ₫</span>
                    </div>
                    {cost.notes && (
                      <p className="text-xs text-muted-foreground">{cost.notes}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <EditIncidentalCostDialog cost={cost} orderId={orderId} />
                    <DeleteIncidentalCostButton cost={cost} orderId={orderId} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

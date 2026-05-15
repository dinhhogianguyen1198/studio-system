"use client"

import { useState, useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from "../../types/orders.types"
import { recordPaymentAction } from "../../actions/order-item.actions"

interface Props {
  orderId: string
}

const initialState: ActionResult<void> = { success: false, error: "" }

export function RecordPaymentDialog({ orderId }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(recordPaymentAction, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success("Đã ghi nhận thanh toán")
      setOpen(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Ghi nhận thanh toán
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ghi nhận thanh toán</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="type" className="block text-sm font-medium">
                Loại thanh toán <span className="text-red-500">*</span>
              </label>
              <Select id="type" name="type" defaultValue="DEPOSIT">
                {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="method" className="block text-sm font-medium">
                Phương thức <span className="text-red-500">*</span>
              </label>
              <Select id="method" name="method" defaultValue="BANK_TRANSFER">
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="amount" className="block text-sm font-medium">
              Số tiền (VND) <span className="text-red-500">*</span>
            </label>
            <Input id="amount" name="amount" type="number" min={1} step={1000} required />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reference" className="block text-sm font-medium">
              Mã giao dịch
            </label>
            <Input id="reference" name="reference" placeholder="FT12345..." />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="note" className="block text-sm font-medium">
              Ghi chú
            </label>
            <Textarea id="note" name="note" rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Ghi nhận"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

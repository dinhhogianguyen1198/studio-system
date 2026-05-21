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
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from "../../types/orders.types"
import { recordPaymentAction } from "../../actions/order-item.actions"

interface Props {
  orderId: string
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-sm font-medium"

const initialState: ActionResult<void> = { success: false, error: "" }

export function RecordPaymentDialog({ orderId }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(recordPaymentAction, initialState)

  const [type, setType] = useState("DEPOSIT")
  const [method, setMethod] = useState("BANK_TRANSFER")
  const [amountRaw, setAmountRaw] = useState(0)
  const [amountDisplay, setAmountDisplay] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã ghi nhận thanh toán")
      setOpen(false)
      setType("DEPOSIT")
      setMethod("BANK_TRANSFER")
      setAmountRaw(0)
      setAmountDisplay("")
      setReference("")
      setNote("")
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
        <Button size="sm" variant="outline" className="w-full">
          Ghi nhận thanh toán
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ghi nhận thanh toán</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="amount" value={amountRaw || ""} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="pay-type" className={labelClass}>
                Loại thanh toán <span className="text-destructive">*</span>
              </label>
              <Select
                id="pay-type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pay-method" className={labelClass}>
                Phương thức <span className="text-destructive">*</span>
              </label>
              <Select
                id="pay-method"
                name="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pay-amount" className={labelClass}>
              Số tiền (VND) <span className="text-destructive">*</span>
            </label>
            <input
              id="pay-amount"
              type="text"
              inputMode="numeric"
              placeholder="1.000.000"
              value={amountDisplay}
              onChange={handleAmountChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pay-reference" className={labelClass}>Mã giao dịch</label>
            <input
              id="pay-reference"
              name="reference"
              placeholder="FT12345..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pay-note" className={labelClass}>Ghi chú</label>
            <Textarea
              id="pay-note"
              name="note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
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

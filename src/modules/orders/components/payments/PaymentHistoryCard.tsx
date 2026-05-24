"use client"

import { useState, useActionState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Pencil, Trash2 } from "lucide-react"
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
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"
import { PAYMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "../../types/orders.types"
import { updatePaymentAction, deletePaymentAction } from "../../actions/order-item.actions"
import { RecordPaymentDialog } from "./RecordPaymentDialog"

interface Payment {
  id: string
  type: string
  amount: number
  method: string
  reference: string | null
  note: string | null
  paidAt: string
  recordedBy: { id: string; name: string | null }
}

interface FinancialSummary {
  subtotal: number
  incidentalCostsTotal: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  currency: string
}

interface Props {
  orderId: string
  payments: Payment[]
  financial: FinancialSummary
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-sm font-medium"

function EditPaymentDialog({ payment, orderId }: { payment: Payment; orderId: string }) {
  const [open, setOpen] = useState(false)
  const boundAction = updatePaymentAction.bind(null, payment.id, orderId)
  const initialState: ActionResult<void> = { success: false, error: "" }
  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  const [type, setType] = useState(payment.type)
  const [method, setMethod] = useState(payment.method)
  const [amountRaw, setAmountRaw] = useState(payment.amount)
  const [amountDisplay, setAmountDisplay] = useState(
    payment.amount > 0 ? payment.amount.toLocaleString("vi-VN") : "",
  )
  const [reference, setReference] = useState(payment.reference ?? "")
  const [note, setNote] = useState(payment.note ?? "")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã cập nhật thanh toán")
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
          <DialogTitle>Sửa đợt thanh toán</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="amount" value={amountRaw || ""} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-pay-type" className={labelClass}>
                Loại <span className="text-destructive">*</span>
              </label>
              <Select id="edit-pay-type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-pay-method" className={labelClass}>
                Phương thức <span className="text-destructive">*</span>
              </label>
              <Select id="edit-pay-method" name="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-pay-amount" className={labelClass}>
              Số tiền (VND) <span className="text-destructive">*</span>
            </label>
            <input
              id="edit-pay-amount"
              type="text"
              inputMode="numeric"
              placeholder="1.000.000"
              value={amountDisplay}
              onChange={handleAmountChange}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-pay-reference" className={labelClass}>Mã giao dịch</label>
            <input
              id="edit-pay-reference"
              name="reference"
              placeholder="FT12345..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-pay-note" className={labelClass}>Ghi chú</label>
            <Textarea id="edit-pay-note" name="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
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

function DeletePaymentButton({ payment, orderId }: { payment: Payment; orderId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePaymentAction(payment.id, orderId)
      if (result.success) {
        toast.success("Đã xóa đợt thanh toán")
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
          <DialogTitle>Xóa đợt thanh toán</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa đợt{" "}
            <strong>{PAYMENT_TYPE_LABELS[payment.type] ?? payment.type}</strong> —{" "}
            <strong>{payment.amount.toLocaleString("vi-VN")} ₫</strong>?
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

export function PaymentHistoryCard({ orderId, payments, financial }: Props) {
  const debt = financial.totalAmount - financial.paidAmount
  const fmt = (n: number) => n.toLocaleString("vi-VN")

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Thanh toán</CardTitle>
          <RecordPaymentDialog orderId={orderId} />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        {/* Financial summary */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-muted-foreground">
            <span>Tạm tính</span>
            <span className="tabular-nums">{fmt(financial.subtotal)}</span>
          </div>
          {financial.incidentalCostsTotal > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Chi phí phát sinh</span>
              <span className="tabular-nums text-destructive">−{fmt(financial.incidentalCostsTotal)}</span>
            </div>
          )}
          {financial.discountAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Giảm giá</span>
              <span className="tabular-nums text-destructive">−{fmt(financial.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Tổng cộng</span>
            <span className="tabular-nums">{fmt(financial.totalAmount)} {financial.currency}</span>
          </div>
          <div className="flex justify-between text-success-foreground">
            <span>Đã thanh toán</span>
            <span className="tabular-nums">{fmt(financial.paidAmount)}</span>
          </div>
          {debt > 0 && (
            <div className="flex justify-between font-semibold text-warning-foreground">
              <span>Còn lại</span>
              <span className="tabular-nums">{fmt(debt)}</span>
            </div>
          )}
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-start gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{PAYMENT_TYPE_LABELS[p.type] ?? p.type}</span>
                      <span className="tabular-nums font-medium">{p.amount.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[p.method]} •{" "}
                      {format(new Date(p.paidAt), "dd/MM/yyyy", { locale: vi })}
                      {p.reference && ` • ${p.reference}`}
                    </p>
                    {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <EditPaymentDialog payment={p} orderId={orderId} />
                    <DeletePaymentButton payment={p} orderId={orderId} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

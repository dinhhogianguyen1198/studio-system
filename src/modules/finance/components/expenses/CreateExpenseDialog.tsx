"use client"

import { useState, useEffect, useActionState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { createExpenseAction } from "../../actions/expense.actions"
import type { ExpenseCategorySummary } from "../../types/finance.types"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  CARD: "Thẻ",
  OTHER: "Khác",
}

interface Props {
  categories: ExpenseCategorySummary[]
  orderId?: string
  onSuccess?: () => void
}

export function CreateExpenseDialog({ categories, orderId, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [amountDisplay, setAmountDisplay] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")

  const [state, formAction, isPending] = useActionState(createExpenseAction, { success: false as const, error: "" })

  useEffect(() => {
    if (state.success) {
      toast.success("Đã tạo chi phí")
      setOpen(false)
      setTitle("")
      setAmount("")
      setAmountDisplay("")
      setCategoryId("")
      setExpenseDate(new Date().toISOString().slice(0, 10))
      setPaymentMethod("")
      setReference("")
      setNotes("")
      onSuccess?.()
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, onSuccess])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "")
    setAmount(raw)
    setAmountDisplay(raw ? parseInt(raw).toLocaleString("vi-VN") : "")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Thêm chi phí
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm chi phí mới</DialogTitle>
          <DialogDescription>Nhập thông tin chi phí phát sinh</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {orderId && <input type="hidden" name="orderId" value={orderId} />}

          <div className="space-y-1.5">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Thuê máy quay Sony FX3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Số tiền (VND) *</Label>
              <div className="relative">
                <Input
                  id="amount-display"
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="0"
                />
                <input type="hidden" name="amount" value={amount} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expenseDate">Ngày chi *</Label>
              <Input
                id="expenseDate"
                name="expenseDate"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Danh mục *</Label>
            <Select
              id="categoryId"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
              <Select
                id="paymentMethod"
                name="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Chọn (tùy chọn)</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">Mã tham chiếu</Label>
              <Input
                id="reference"
                name="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Số hóa đơn, mã giao dịch..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ghi chú thêm..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Tạo chi phí"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

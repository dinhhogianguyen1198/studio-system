"use client"

import { useState, useEffect, useActionState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
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
import { createInvoiceAction } from "../../actions/invoice.actions"

interface InvoiceItemRow {
  description: string
  quantity: string
  unitPrice: string
  unitPriceDisplay: string
}

interface Props {
  orderId?: string
  customerId?: string
  orderNumber?: string
  prefillItems?: Array<{ description: string; quantity: number; unitPrice: number }>
}

export function CreateInvoiceDialog({ orderId, customerId, orderNumber, prefillItems }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<InvoiceItemRow[]>(
    prefillItems?.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      unitPriceDisplay: item.unitPrice.toLocaleString("vi-VN"),
    })) ?? [{ description: "", quantity: "1", unitPrice: "", unitPriceDisplay: "" }],
  )

  const [state, formAction, isPending] = useActionState(createInvoiceAction, {
    success: false as const,
    error: "",
  })

  useEffect(() => {
    if (state.success) {
      toast.success("Đã tạo hóa đơn")
      setOpen(false)
      router.push(`/dashboard/finance/invoices/${state.data.id}`)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "", unitPriceDisplay: "" }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof InvoiceItemRow, value: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        if (field === "unitPrice") {
          const raw = value.replace(/\D/g, "")
          return {
            ...item,
            unitPrice: raw,
            unitPriceDisplay: raw ? parseInt(raw).toLocaleString("vi-VN") : "",
          }
        }
        return { ...item, [field]: value }
      }),
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Tạo hóa đơn{orderNumber ? ` cho ${orderNumber}` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo hóa đơn mới</DialogTitle>
          <DialogDescription>
            {orderNumber ? `Hóa đơn cho đơn hàng ${orderNumber}` : "Nhập thông tin hóa đơn"}
          </DialogDescription>
        </DialogHeader>

        <form
          action={(fd) => {
            fd.append("items", JSON.stringify(
              items.map((item, i) => ({
                description: item.description,
                quantity: parseFloat(item.quantity) || 1,
                unitPrice: parseFloat(item.unitPrice) || 0,
                sortOrder: i,
              }))
            ))
            formAction(fd)
          }}
          className="space-y-4"
        >
          {orderId && <input type="hidden" name="orderId" value={orderId} />}
          {customerId && <input type="hidden" name="customerId" value={customerId} />}

          <div className="space-y-1.5">
            <Label>Hạn thanh toán *</Label>
            <Input
              name="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Danh sách dịch vụ *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Thêm dòng
              </Button>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground">Mô tả</th>
                    <th className="w-20 px-3 py-2 text-center text-xs text-muted-foreground">SL</th>
                    <th className="w-36 px-3 py-2 text-right text-xs text-muted-foreground">Đơn giá</th>
                    <th className="w-36 px-3 py-2 text-right text-xs text-muted-foreground">Thành tiền</th>
                    <th className="w-8 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
                    return (
                      <tr key={index} className="border-b border-border last:border-0">
                        <td className="px-2 py-1.5">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            placeholder="Tên dịch vụ"
                            className="h-7 border-0 p-0 text-sm focus-visible:ring-0"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            className="h-7 border-0 p-0 text-center text-sm focus-visible:ring-0"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={item.unitPriceDisplay}
                            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                            placeholder="0"
                            className="h-7 border-0 p-0 text-right text-sm focus-visible:ring-0"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right text-sm font-medium tabular-nums">
                          {lineTotal.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-2 py-1.5">
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/20">
                    <td colSpan={3} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Tổng cộng
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold tabular-nums">
                      {subtotal.toLocaleString("vi-VN")}đ
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Ghi chú / Điều khoản</Label>
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ghi chú thanh toán, điều khoản..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang tạo..." : "Tạo hóa đơn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

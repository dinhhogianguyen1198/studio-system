"use client"

import { useState, useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ActionResult } from "@/shared/types/api.types"
import type { SerializedOrderItemSummary } from "../../types/orders.types"
import { updateOrderItemAction } from "../../actions/order-item.actions"

interface Props {
  item: SerializedOrderItemSummary
  orderId: string
}

const initialState: ActionResult<void> = { success: false, error: "" }

const fieldClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-xs font-medium text-muted-foreground"

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

function calculateDeadline(eventDateStr: string, durationDays: number | null): string {
  if (!eventDateStr || durationDays == null) return ""
  const date = new Date(eventDateStr)
  date.setDate(date.getDate() + durationDays)
  return date.toISOString().slice(0, 10)
}

export function EditOrderItemDialog({ item, orderId }: Props) {
  const [open, setOpen] = useState(false)
  const action = updateOrderItemAction.bind(null, item.id, orderId)
  const [state, formAction, isPending] = useActionState(action, initialState)

  const durationDays = item.serviceDefinition.defaultDurationDays ?? null

  const [price, setPrice] = useState(item.price)
  const [eventDate, setEventDate] = useState(toDateInput(item.eventDate))
  const [deadline, setDeadline] = useState(toDateInput(item.deadline))
  const [notes, setNotes] = useState(item.notes ?? "")
  const [itemLocation, setItemLocation] = useState(item.location ?? "")

  const isDeadlineAutoCalc = !!eventDate && durationDays != null

  function handleEventDateChange(value: string) {
    setEventDate(value)
    if (value && durationDays != null) {
      setDeadline(calculateDeadline(value, durationDays))
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "")
    setPrice(Number(raw) || 0)
  }

  useEffect(() => {
    if (state.success) {
      toast.success("Đã cập nhật dịch vụ")
      setOpen(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  // Reset form state when dialog opens
  function handleOpenChange(next: boolean) {
    if (next) {
      setPrice(item.price)
      setEventDate(toDateInput(item.eventDate))
      setDeadline(toDateInput(item.deadline))
      setNotes(item.notes ?? "")
      setItemLocation(item.location ?? "")
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Hidden raw price for submission */}
          <input type="hidden" name="price" value={price} />

          {/* Giá */}
          <div className="space-y-1.5">
            <label className={labelClass}>Giá (₫)</label>
            <input
              type="text"
              inputMode="numeric"
              value={price.toLocaleString("vi-VN")}
              onChange={handlePriceChange}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Ngày diễn ra */}
            <div className="space-y-1.5">
              <label className={labelClass}>Ngày diễn ra</label>
              <input
                type="date"
                name="eventDate"
                value={eventDate}
                onChange={(e) => handleEventDateChange(e.target.value)}
                className={cn(fieldClass, "cursor-pointer")}
              />
            </div>

            {/* Ngày trả file */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Ngày trả file
                {durationDays != null && (
                  <span className="ml-1 text-muted-foreground/50">+{durationDays}d</span>
                )}
              </label>
              <input
                type="date"
                name="deadline"
                value={deadline}
                readOnly={isDeadlineAutoCalc}
                onChange={(e) => setDeadline(e.target.value)}
                className={cn(
                  fieldClass,
                  "cursor-pointer",
                  isDeadlineAutoCalc && "bg-muted text-muted-foreground",
                )}
              />
            </div>
          </div>

          {/* Địa điểm */}
          <div className="space-y-1.5">
            <label className={labelClass}>Địa điểm</label>
            <input
              type="text"
              name="location"
              value={itemLocation}
              onChange={(e) => setItemLocation(e.target.value)}
              placeholder="VD: Hội trường A, Nhà hàng ABC..."
              className={fieldClass}
            />
          </div>

          {/* Ghi chú */}
          <div className="space-y-1.5">
            <label className={labelClass}>Ghi chú</label>
            <textarea
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Yêu cầu cụ thể..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

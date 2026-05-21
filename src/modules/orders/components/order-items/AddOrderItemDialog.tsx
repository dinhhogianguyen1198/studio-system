"use client"

import { useState, useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, X, PackageX, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActionResult } from "@/shared/types/api.types"
import type { SerializedServiceDefinitionSummary } from "@/modules/services/types/services.types"
import { addOrderItemAction } from "../../actions/order-item.actions"

interface Props {
  orderId: string
  services: SerializedServiceDefinitionSummary[]
}

const initialState: ActionResult<void> = { success: false, error: "" }

const fieldClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

export function AddOrderItemDialog({ orderId, services }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"pick" | "fill">("pick")
  const [selected, setSelected] = useState<SerializedServiceDefinitionSummary | null>(null)
  const [priceDisplay, setPriceDisplay] = useState("")
  const [priceRaw, setPriceRaw] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [eventDate, setEventDate] = useState("")
  const [deadline, setDeadline] = useState("")
  const [notes, setNotes] = useState("")
  const [itemLocation, setItemLocation] = useState("")

  const action = addOrderItemAction.bind(null, orderId)
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success("Đã thêm dịch vụ")
      handleClose()
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  function handleClose() {
    setOpen(false)
    setStep("pick")
    setSelected(null)
    setPriceDisplay("")
    setPriceRaw(0)
    setQuantity(1)
    setEventDate("")
    setDeadline("")
    setNotes("")
    setItemLocation("")
  }

  function calculateDeadline(eventDateStr: string, durationDays: number | null): string {
    if (!eventDateStr || durationDays == null) return ""
    const date = new Date(eventDateStr)
    date.setDate(date.getDate() + durationDays)
    return date.toISOString().slice(0, 10)
  }

  function handleSelectService(svc: SerializedServiceDefinitionSummary) {
    setSelected(svc)
    setPriceRaw(svc.defaultPrice)
    setPriceDisplay(svc.defaultPrice.toLocaleString("vi-VN"))
    setStep("fill")
  }

  function handleEventDateChange(value: string) {
    setEventDate(value)
    if (value && selected?.defaultDurationDays != null) {
      setDeadline(calculateDeadline(value, selected.defaultDurationDays))
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "")
    const num = raw ? Number(raw) : 0
    setPriceRaw(num)
    setPriceDisplay(raw ? num.toLocaleString("vi-VN") : "")
  }

  const durationDays = selected?.defaultDurationDays ?? null
  const isDeadlineAutoCalc = !!eventDate && durationDays != null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        Thêm dịch vụ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

            {step === "pick" ? (
              <>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Chọn dịch vụ</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">Chọn dịch vụ để thêm vào đơn hàng</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-y-auto p-6">
                  {services.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <PackageX className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Chưa có dịch vụ nào</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tạo dịch vụ trong mục{" "}
                          <a href="/dashboard/services" className="text-primary hover:underline">
                            Dịch vụ
                          </a>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {services.map((svc) => (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => handleSelectService(svc)}
                          className="group relative flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight text-foreground">{svc.name}</p>
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card opacity-0 transition-opacity group-hover:opacity-100">
                              <Plus className="h-3 w-3 text-muted-foreground" />
                            </span>
                          </div>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {svc.defaultPrice.toLocaleString("vi-VN")} ₫
                          </p>
                          {svc.defaultDurationDays != null && (
                            <p className="text-xs text-muted-foreground">{svc.defaultDurationDays} ngày</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("pick")}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Chi tiết dịch vụ</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">{selected?.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form action={formAction} className="overflow-y-auto p-6">
                  <input type="hidden" name="serviceDefinitionId" value={selected?.id ?? ""} />
                  <input type="hidden" name="price" value={priceRaw} />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Giá (₫) <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={priceDisplay}
                          onChange={handlePriceChange}
                          className={fieldClass}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground">Số lượng</label>
                        <input
                          name="quantity"
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground">Ngày diễn ra</label>
                        <input
                          name="eventDate"
                          type="date"
                          value={eventDate}
                          onChange={(e) => handleEventDateChange(e.target.value)}
                          className={cn(fieldClass, "cursor-pointer")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Ngày trả file
                          {durationDays != null && (
                            <span className="ml-1 opacity-50">+{durationDays}d</span>
                          )}
                        </label>
                        <input
                          name="deadline"
                          type="date"
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

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-muted-foreground">Địa điểm</label>
                      <input
                        name="location"
                        type="text"
                        value={itemLocation}
                        onChange={(e) => setItemLocation(e.target.value)}
                        placeholder="VD: Hội trường A, Nhà hàng ABC..."
                        className={fieldClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-muted-foreground">Ghi chú</label>
                      <textarea
                        name="notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Yêu cầu cụ thể..."
                        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setStep("pick")}
                        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-all hover:bg-muted"
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isPending ? "Đang thêm..." : "Thêm dịch vụ"}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

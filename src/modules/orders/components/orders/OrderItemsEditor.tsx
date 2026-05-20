"use client"

import { Trash2, PackageX, Check, X, Plus, GripVertical, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SerializedServiceDefinitionSummary } from "@/modules/services/types/services.types"

export interface OrderItemDraft {
  _key: string
  serviceDefinitionId: string
  serviceName: string
  defaultDurationDays: number | null
  price: number
  quantity: number
  eventDate?: string
  deadline?: string
  notes?: string
}

// ─── Service Picker Dialog ────────────────────────────────────────────────────

interface ServicePickerDialogProps {
  services: SerializedServiceDefinitionSummary[]
  addedIds: Set<string>
  onAdd: (svc: SerializedServiceDefinitionSummary) => void
  onClose: () => void
}

function ServicePickerDialog({ services, addedIds, onAdd, onClose }: ServicePickerDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Chọn dịch vụ</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Chọn một hoặc nhiều dịch vụ để thêm vào đơn hàng</p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                  <a href="/dashboard/services" className="text-primary hover:underline">Dịch vụ</a>
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {services.map((svc) => {
                const isAdded = addedIds.has(svc.id)
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => onAdd(svc)}
                    className={cn(
                      "group relative flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all duration-200",
                      isAdded
                        ? "cursor-default border-primary/25 bg-primary/5"
                        : "border-border bg-card hover:border-primary/40 hover:shadow-sm active:scale-[0.98]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-semibold leading-tight", isAdded ? "text-primary" : "text-foreground")}>
                        {svc.name}
                      </p>
                      {isAdded ? (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card opacity-0 transition-opacity group-hover:opacity-100">
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {svc.defaultPrice.toLocaleString("vi-VN")} ₫
                    </p>
                    {svc.defaultDurationDays != null && (
                      <p className="text-xs text-muted-foreground">{svc.defaultDurationDays} ngày</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Order Item Card ──────────────────────────────────────────────────────────

interface OrderItemCardProps {
  item: OrderItemDraft
  onRemove: (key: string) => void
  onUpdate: (key: string, updates: Partial<OrderItemDraft>) => void
}

const fieldInputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

function calculateDeadline(eventDate: string, durationDays: number | null): string {
  if (!eventDate || durationDays == null) return ""
  const date = new Date(eventDate)
  date.setDate(date.getDate() + durationDays)
  return date.toISOString().slice(0, 10)
}

function OrderItemCard({ item, onRemove, onUpdate }: OrderItemCardProps) {
  const isDeadlineAutoCalc = item.eventDate != null && item.defaultDurationDays != null

  function handleEventDateChange(value: string) {
    const deadline = value && item.defaultDurationDays != null
      ? calculateDeadline(value, item.defaultDurationDays)
      : undefined
    onUpdate(item._key, { eventDate: value || undefined, deadline: deadline || undefined })
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "")
    onUpdate(item._key, { price: Number(raw) || 0 })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground/40" />
        <p className="flex-1 text-sm font-semibold text-foreground">{item.serviceName}</p>
        <button
          type="button"
          onClick={() => onRemove(item._key)}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Xóa"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-3 gap-3 border-t border-border bg-muted/40 px-4 py-4">
        {/* Giá */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Giá (₫)</label>
          <input
            type="text"
            inputMode="numeric"
            value={item.price.toLocaleString("vi-VN")}
            onChange={handlePriceChange}
            className={fieldInputClass}
          />
        </div>

        {/* Ngày diễn ra */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Ngày diễn ra</label>
          <input
            type="date"
            value={item.eventDate ?? ""}
            onChange={(e) => handleEventDateChange(e.target.value)}
            className={cn(fieldInputClass, "cursor-pointer")}
          />
        </div>

        {/* Ngày trả file */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Ngày trả file
            {item.defaultDurationDays != null && (
              <span className="ml-1 text-muted-foreground/50">+{item.defaultDurationDays}d</span>
            )}
          </label>
          <input
            type="date"
            value={item.deadline ? item.deadline.slice(0, 10) : ""}
            readOnly={isDeadlineAutoCalc}
            onChange={(e) => onUpdate(item._key, { deadline: e.target.value || undefined })}
            className={cn(
              fieldInputClass,
              "cursor-pointer",
              isDeadlineAutoCalc && "bg-muted text-muted-foreground",
            )}
          />
        </div>

        {/* Ghi chú */}
        <div className="col-span-3 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Ghi chú</label>
          <input
            type="text"
            value={item.notes ?? ""}
            onChange={(e) => onUpdate(item._key, { notes: e.target.value || undefined })}
            placeholder="Yêu cầu cụ thể..."
            className={cn(fieldInputClass, "placeholder:text-muted-foreground")}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  services: SerializedServiceDefinitionSummary[]
  items: OrderItemDraft[]
  onChange: (items: OrderItemDraft[]) => void
  isPickerOpen: boolean
  onPickerOpenChange: (open: boolean) => void
}

export function OrderItemsEditor({ services, items, onChange, isPickerOpen, onPickerOpenChange }: Props) {
  const addedIds = new Set(items.map((i) => i.serviceDefinitionId))

  function handleAdd(svc: SerializedServiceDefinitionSummary) {
    if (addedIds.has(svc.id)) return
    onChange([
      ...items,
      {
        _key: crypto.randomUUID(),
        serviceDefinitionId: svc.id,
        serviceName: svc.name,
        defaultDurationDays: svc.defaultDurationDays ?? null,
        price: svc.defaultPrice,
        quantity: 1,
      },
    ])
  }

  function handleRemove(key: string) {
    onChange(items.filter((i) => i._key !== key))
  }

  function handleUpdate(key: string, updates: Partial<OrderItemDraft>) {
    onChange(items.map((i) => (i._key === key ? { ...i, ...updates } : i)))
  }

  return (
    <>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <OrderItemCard key={item._key} item={item} onRemove={handleRemove} onUpdate={handleUpdate} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Chưa có dịch vụ nào</p>
            <p className="mt-1 text-xs text-muted-foreground">Bấm "Thêm dịch vụ" để chọn dịch vụ cho đơn hàng</p>
          </div>
        </div>
      )}

      {isPickerOpen && (
        <ServicePickerDialog
          services={services}
          addedIds={addedIds}
          onAdd={handleAdd}
          onClose={() => onPickerOpenChange(false)}
        />
      )}
    </>
  )
}

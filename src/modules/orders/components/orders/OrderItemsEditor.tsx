"use client"

import { useState } from "react"
import { Trash2, PackageX, ChevronDown, ChevronUp, GripVertical, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SerializedServiceDefinitionSummary } from "@/modules/services/types/services.types"

export interface OrderItemDraft {
  _key: string
  serviceDefinitionId: string
  serviceName: string
  price: number
  quantity: number
  deadline?: string
  notes?: string
}

interface ServicePickerCardProps {
  service: SerializedServiceDefinitionSummary
  onAdd: (svc: SerializedServiceDefinitionSummary) => void
  isAdded: boolean
}

function ServicePickerCard({ service, onAdd, isAdded }: ServicePickerCardProps) {
  return (
    <button
      type="button"
      onClick={() => !isAdded && onAdd(service)}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all duration-200",
        isAdded
          ? "border-primary/25 bg-primary/5 cursor-default"
          : "border-border bg-card hover:border-primary/40 hover:shadow-sm active:scale-[0.98]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-sm font-semibold leading-tight", isAdded ? "text-primary" : "text-foreground")}>
          {service.name}
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
        {service.defaultPrice.toLocaleString("vi-VN")} ₫
      </p>
      {service.defaultDurationDays != null && (
        <p className="text-xs text-muted-foreground">{service.defaultDurationDays} ngày</p>
      )}
    </button>
  )
}

interface OrderItemRowProps {
  item: OrderItemDraft
  onRemove: (key: string) => void
  onUpdate: (key: string, updates: Partial<OrderItemDraft>) => void
}

const rowInputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

function OrderItemRow({ item, onRemove, onUpdate }: OrderItemRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-all">
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground/50" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground">{item.serviceName}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.quantity} × {item.price.toLocaleString("vi-VN")} ₫ ={" "}
            <strong className="font-semibold text-foreground">
              {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
            </strong>
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Sửa"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(item._key)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Xóa"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-2 gap-3 border-t border-border bg-muted px-4 py-4">
          {(
            [
              { label: "Giá (VND)", type: "number" as const, field: "price" as const, min: 0, step: 1000, value: String(item.price) },
              { label: "Số lượng", type: "number" as const, field: "quantity" as const, min: 1, step: 1, value: String(item.quantity) },
            ] as const
          ).map(({ label, type, field, min, step, value }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <input
                type={type}
                min={min}
                step={step}
                value={value}
                onChange={(e) => onUpdate(item._key, { [field]: Number(e.target.value) })}
                className={rowInputClass}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Deadline</label>
            <input
              type="datetime-local"
              value={item.deadline ?? ""}
              onChange={(e) => onUpdate(item._key, { deadline: e.target.value || undefined })}
              className={rowInputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Ghi chú</label>
            <input
              type="text"
              value={item.notes ?? ""}
              onChange={(e) => onUpdate(item._key, { notes: e.target.value || undefined })}
              placeholder="Yêu cầu cụ thể..."
              className={cn(rowInputClass, "placeholder:text-muted-foreground")}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  services: SerializedServiceDefinitionSummary[]
  items: OrderItemDraft[]
  onChange: (items: OrderItemDraft[]) => void
}

export function OrderItemsEditor({ services, items, onChange }: Props) {
  const addedIds = new Set(items.map((i) => i.serviceDefinitionId))

  function handleAdd(svc: SerializedServiceDefinitionSummary) {
    onChange([
      ...items,
      {
        _key: crypto.randomUUID(),
        serviceDefinitionId: svc.id,
        serviceName: svc.name,
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

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
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
    )
  }

  return (
    <div className="space-y-5">
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <OrderItemRow key={item._key} item={item} onRemove={handleRemove} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Chọn dịch vụ để thêm
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {services.map((svc) => (
            <ServicePickerCard
              key={svc.id}
              service={svc}
              onAdd={handleAdd}
              isAdded={addedIds.has(svc.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

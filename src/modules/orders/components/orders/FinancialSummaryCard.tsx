"use client"

import { cn } from "@/lib/utils"
import type { OrderItemDraft } from "./OrderItemsEditor"

interface Props {
  items: OrderItemDraft[]
  subtotal: number
  discount: number
  onDiscountChange: (value: number) => void
  applyVat: boolean
  onApplyVatChange: (value: boolean) => void
  vatAmount: number
  total: number
}

export function FinancialSummaryCard({
  items,
  subtotal,
  discount,
  onDiscountChange,
  applyVat,
  onApplyVatChange,
  vatAmount,
  total,
}: Props) {
  function handleDiscountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "")
    onDiscountChange(Number(raw) || 0)
  }

  return (
    <div className="sticky top-6 overflow-hidden rounded-xl border border-border bg-card">

      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Tóm tắt đơn hàng</h2>
      </div>

      {/* Service breakdown */}
      <div className="px-5 py-4">
        {items.length > 0 ? (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item._key} className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {item.serviceName}
                </p>
                <p className="shrink-0 text-xs tabular-nums font-medium text-foreground">
                  {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-center text-xs text-muted-foreground">Chưa có dịch vụ nào</p>
        )}
      </div>

      {/* Controls: discount + VAT */}
      <div className="space-y-3 border-t border-border px-5 py-4">
        <div className="space-y-1.5">
          <label htmlFor="discountAmount" className="block text-xs font-medium text-muted-foreground">
            Giảm giá (₫)
          </label>
          <input
            id="discountAmount"
            name="discountAmount"
            type="text"
            inputMode="numeric"
            value={discount > 0 ? discount.toLocaleString("vi-VN") : ""}
            onChange={handleDiscountChange}
            placeholder="0"
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Áp dụng VAT (10%)</span>
          <button
            type="button"
            role="switch"
            aria-checked={applyVat}
            onClick={() => onApplyVatChange(!applyVat)}
            className={cn(
              "relative h-5 w-9 rounded-full transition-all duration-200",
              applyVat ? "bg-primary" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
                applyVat ? "left-4.5" : "left-0.5",
              )}
            />
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tạm tính</span>
          <span className="text-xs tabular-nums font-medium text-foreground">
            {subtotal.toLocaleString("vi-VN")} ₫
          </span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Giảm giá</span>
            <span className="text-xs tabular-nums font-medium text-success-foreground">
              −{discount.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        )}

        {applyVat && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">VAT (10%)</span>
            <span className="text-xs tabular-nums font-medium text-warning-foreground">
              +{vatAmount.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-muted px-3.5 py-3 mt-1">
          <span className="text-sm font-bold text-foreground">Tổng cộng</span>
          <span className="text-lg font-bold tabular-nums text-primary">
            {total.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      </div>

    </div>
  )
}

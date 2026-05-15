"use client"

import { cn } from "@/lib/utils"

interface Props {
  subtotal: number
  discount: number
  onDiscountChange: (value: number) => void
  applyVat: boolean
  onApplyVatChange: (value: boolean) => void
  vatAmount: number
  total: number
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-xs font-medium text-foreground"

export function FinancialSummaryCard({
  subtotal,
  discount,
  onDiscountChange,
  applyVat,
  onApplyVatChange,
  vatAmount,
  total,
}: Props) {
  return (
    <div className="sticky top-6 rounded-xl bg-card p-6 border border-border">
      <h2 className="mb-5 text-base font-semibold text-foreground">Tóm tắt tài chính</h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="discountAmount" className={labelClass}>
            Giảm giá (VND)
          </label>
          <input
            id="discountAmount"
            name="discountAmount"
            type="number"
            min={0}
            step={1000}
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
          <span className="text-sm font-medium text-foreground">Áp dụng VAT (10%)</span>
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
                "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-all duration-200",
                applyVat ? "left-[18px]" : "left-0.5",
              )}
            />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-border pt-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tạm tính</span>
          <span className="tabular-nums font-medium text-foreground">
            {subtotal.toLocaleString("vi-VN")} ₫
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Giảm giá</span>
            <span className="tabular-nums font-medium text-success-foreground">
              −{discount.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        )}
        {applyVat && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT (10%)</span>
            <span className="tabular-nums font-medium text-warning-foreground">
              +{vatAmount.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between rounded-lg bg-muted px-4 py-3.5">
          <span className="text-sm font-bold text-foreground">Tổng cộng</span>
          <span className="text-xl font-bold tabular-nums text-primary">
            {total.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useActionState, useEffect } from "react"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ActionResult } from "@/shared/types/api.types"
import { createCustomerQuickAction } from "@/modules/crm/actions/customer.actions"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (customer: { id: string; name: string; phone: string | null }) => void
}

const initialState: ActionResult<{ id: string; name: string; phone: string | null }> = {
  success: false,
  error: "",
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-xs font-medium text-foreground"

export function QuickCreateCustomerDialog({ open, onOpenChange, onCreated }: Props) {
  const [state, formAction, isPending] = useActionState(createCustomerQuickAction, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success("Đã tạo khách hàng mới")
      onCreated(state.data)
      onOpenChange(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, onCreated, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Tạo khách hàng mới
              </DialogTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">Thêm khách hàng vào hệ thống CRM</p>
            </div>
          </div>
        </DialogHeader>

        <form action={formAction} className="mt-2 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="quick-name" className={labelClass}>
                Tên khách hàng <span className="text-destructive">*</span>
              </label>
              <input
                id="quick-name"
                name="name"
                placeholder="Nguyễn Văn A"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="quick-phone" className={labelClass}>Số điện thoại</label>
              <input
                id="quick-phone"
                name="phone"
                placeholder="0901234567"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-email" className={labelClass}>Email</label>
            <input
              id="quick-email"
              name="email"
              type="email"
              placeholder="email@example.com"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-address" className={labelClass}>Địa chỉ</label>
            <input
              id="quick-address"
              name="address"
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
              className={inputClass}
            />
          </div>

          <DialogFooter className="mt-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "h-9 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all",
                "hover:bg-primary/90",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isPending ? "Đang tạo..." : "Tạo khách hàng"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

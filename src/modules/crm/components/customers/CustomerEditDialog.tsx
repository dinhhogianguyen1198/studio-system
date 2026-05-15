"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateCustomerAction } from "../../actions/customer.actions"
import type { CustomerDetailData } from "../../actions/customer.actions"
import type { ActionResult } from "@/shared/types/api.types"

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  children,
  errors,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
  errors?: string[]
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {errors?.[0] && <p className="text-xs text-destructive">{errors[0]}</p>}
    </div>
  )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  customer: CustomerDetailData
  onClose: () => void
  onSuccess: () => void
}

const initial: ActionResult<void> = { success: false, error: "" }

export function CustomerEditDialog({ open, customer, onClose, onSuccess }: Props) {
  const boundAction = updateCustomerAction.bind(null, customer.id)
  const [state, formAction, isPending] = useActionState(boundAction, initial)

  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  })

  useEffect(() => {
    if (state.success) {
      toast.success("Đã cập nhật khách hàng")
      onSuccessRef.current()
    }
  }, [state])

  const fe = !state.success ? state.fieldErrors : undefined

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          {!state.success && state.error && (
            <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên khách hàng *" htmlFor="edit-name" errors={fe?.name}>
              <Input
                id="edit-name"
                name="name"
                defaultValue={customer.name}
                aria-invalid={!!fe?.name}
                className={fe?.name ? "border-destructive" : ""}
              />
            </Field>

            <Field label="Số điện thoại" htmlFor="edit-phone" errors={fe?.phone}>
              <Input
                id="edit-phone"
                name="phone"
                defaultValue={customer.phone ?? ""}
              />
            </Field>

            <Field label="Email" htmlFor="edit-email" errors={fe?.email}>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={customer.email ?? ""}
                aria-invalid={!!fe?.email}
                className={fe?.email ? "border-destructive" : ""}
              />
            </Field>

            <Field label="Địa chỉ" htmlFor="edit-address" errors={fe?.address}>
              <Input
                id="edit-address"
                name="address"
                defaultValue={customer.address ?? ""}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

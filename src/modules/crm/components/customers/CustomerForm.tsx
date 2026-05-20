"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCustomerAction, updateCustomerAction } from "../../actions/customer.actions"
import type { ActionResult } from "@/shared/types/api.types"
import type { CustomerDetail } from "../../types/crm.types"

// ─── Shared field error component ─────────────────────────────────────────────

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>
}

// ─── Form field wrapper ───────────────────────────────────────────────────────

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
      <FieldError errors={errors} />
    </div>
  )
}

// ─── Create form ──────────────────────────────────────────────────────────────

const createInitial: ActionResult<{ id: string }> = { success: false, error: "" }

export function CreateCustomerForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createCustomerAction, createInitial)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")

  useEffect(() => {
    if (state.success) {
      router.push(`/dashboard/customers/${state.data.id}`)
    }
  }, [state, router])

  const fe = !state.success ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-5">
      {!state.success && state.error && (
        <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tên khách hàng *" htmlFor="name" errors={fe?.name}>
          <Input
            id="name"
            name="name"
            placeholder="Nguyễn Văn A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!fe?.name}
            className={fe?.name ? "border-destructive" : ""}
          />
        </Field>

        <Field label="Số điện thoại" htmlFor="phone" errors={fe?.phone}>
          <Input
            id="phone"
            name="phone"
            placeholder="0901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={!!fe?.phone}
            className={fe?.phone ? "border-destructive" : ""}
          />
        </Field>

        <Field label="Email" htmlFor="email" errors={fe?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fe?.email}
            className={fe?.email ? "border-destructive" : ""}
          />
        </Field>

        <Field label="Địa chỉ" htmlFor="address" errors={fe?.address}>
          <Input
            id="address"
            name="address"
            placeholder="123 Đường ABC, Quận 1, TP.HCM"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Tạo khách hàng"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
      </div>
    </form>
  )
}

// ─── Edit form ────────────────────────────────────────────────────────────────

const editInitial: ActionResult<void> = { success: false, error: "" }

export function EditCustomerForm({ customer }: { customer: CustomerDetail }) {
  const router = useRouter()
  const boundAction = updateCustomerAction.bind(null, customer.id)
  const [state, formAction, isPending] = useActionState(boundAction, editInitial)

  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone ?? "")
  const [email, setEmail] = useState(customer.email ?? "")
  const [address, setAddress] = useState(customer.address ?? "")

  useEffect(() => {
    if (state.success) {
      router.push(`/dashboard/customers/${customer.id}`)
    }
  }, [state, router, customer.id])

  const fe = !state.success ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-5">
      {!state.success && state.error && (
        <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tên khách hàng *" htmlFor="name" errors={fe?.name}>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!fe?.name}
            className={fe?.name ? "border-destructive" : ""}
          />
        </Field>

        <Field label="Số điện thoại" htmlFor="phone" errors={fe?.phone}>
          <Input
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        <Field label="Email" htmlFor="email" errors={fe?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fe?.email}
            className={fe?.email ? "border-destructive" : ""}
          />
        </Field>

        <Field label="Địa chỉ" htmlFor="address" errors={fe?.address}>
          <Input
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
      </div>
    </form>
  )
}

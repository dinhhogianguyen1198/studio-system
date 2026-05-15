"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { createLeadAction, updateLeadAction } from "../../actions/lead.actions"
import type { ActionResult } from "@/shared/types/api.types"
import type { LeadDetail } from "../../types/crm.types"
import {
  LEAD_STATUS_LABELS,
  LEAD_PRIORITY_LABELS,
  CUSTOMER_SOURCE_LABELS,
} from "../../types/crm.types"

// ─── Shared field helpers ─────────────────────────────────────────────────────

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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {errors?.[0] && <p className="mt-1 text-xs text-red-600">{errors[0]}</p>}
    </div>
  )
}

// ─── Customer option type for select ─────────────────────────────────────────

interface CustomerOption {
  id: string
  name: string
}

interface UserOption {
  id: string
  name: string | null
  email: string
}

// ─── Create form ──────────────────────────────────────────────────────────────

const createInitial: ActionResult<{ id: string }> = { success: false, error: "" }

export function CreateLeadForm({
  customers,
  users,
}: {
  customers: CustomerOption[]
  users: UserOption[]
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createLeadAction, createInitial)

  useEffect(() => {
    if (state.success) {
      router.push(`/dashboard/leads/${state.data.id}`)
    }
  }, [state, router])

  const fe = !state.success ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-5">
      {!state.success && state.error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Field label="Tiêu đề lead *" htmlFor="title" errors={fe?.title}>
        <Input id="title" name="title" placeholder="Lead từ sự kiện..." aria-invalid={!!fe?.title} className={fe?.title ? "border-red-400" : ""} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tên liên hệ *" htmlFor="contactName" errors={fe?.contactName}>
          <Input id="contactName" name="contactName" placeholder="Nguyễn Văn A" aria-invalid={!!fe?.contactName} className={fe?.contactName ? "border-red-400" : ""} />
        </Field>

        <Field label="Email liên hệ" htmlFor="contactEmail" errors={fe?.contactEmail}>
          <Input id="contactEmail" name="contactEmail" type="email" placeholder="contact@email.com" />
        </Field>

        <Field label="SĐT liên hệ" htmlFor="contactPhone" errors={fe?.contactPhone}>
          <Input id="contactPhone" name="contactPhone" placeholder="0901234567" />
        </Field>

        <Field label="Giá trị (VND)" htmlFor="value" errors={fe?.value}>
          <Input id="value" name="value" type="number" min="0" placeholder="50000000" />
        </Field>

        <Field label="Trạng thái" htmlFor="status" errors={fe?.status}>
          <Select id="status" name="status" defaultValue="NEW">
            {Object.entries(LEAD_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Mức độ ưu tiên" htmlFor="priority" errors={fe?.priority}>
          <Select id="priority" name="priority" defaultValue="MEDIUM">
            {Object.entries(LEAD_PRIORITY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Nguồn" htmlFor="source" errors={fe?.source}>
          <Select id="source" name="source" defaultValue="DIRECT">
            {Object.entries(CUSTOMER_SOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Ngày dự kiến đóng" htmlFor="expectedCloseDate" errors={fe?.expectedCloseDate}>
          <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
        </Field>

        <Field label="Khách hàng liên kết" htmlFor="customerId" errors={fe?.customerId}>
          <Select id="customerId" name="customerId" defaultValue="">
            <option value="">— Không liên kết —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Giao cho" htmlFor="assignedToId" errors={fe?.assignedToId}>
          <Select id="assignedToId" name="assignedToId" defaultValue="">
            <option value="">— Chưa giao —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Tạo lead"}
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

export function EditLeadForm({
  lead,
  customers,
  users,
}: {
  lead: LeadDetail
  customers: CustomerOption[]
  users: UserOption[]
}) {
  const router = useRouter()
  const boundAction = updateLeadAction.bind(null, lead.id)
  const [state, formAction, isPending] = useActionState(boundAction, editInitial)

  useEffect(() => {
    if (state.success) {
      router.push(`/dashboard/leads/${lead.id}`)
    }
  }, [state, router, lead.id])

  const fe = !state.success ? state.fieldErrors : undefined

  const expectedDate = lead.expectedCloseDate
    ? new Date(lead.expectedCloseDate).toISOString().split("T")[0]
    : ""

  return (
    <form action={formAction} className="space-y-5">
      {!state.success && state.error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Field label="Tiêu đề lead *" htmlFor="title" errors={fe?.title}>
        <Input id="title" name="title" defaultValue={lead.title} aria-invalid={!!fe?.title} className={fe?.title ? "border-red-400" : ""} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tên liên hệ *" htmlFor="contactName" errors={fe?.contactName}>
          <Input id="contactName" name="contactName" defaultValue={lead.contactName} aria-invalid={!!fe?.contactName} className={fe?.contactName ? "border-red-400" : ""} />
        </Field>

        <Field label="Email liên hệ" htmlFor="contactEmail" errors={fe?.contactEmail}>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={lead.contactEmail ?? ""} />
        </Field>

        <Field label="SĐT liên hệ" htmlFor="contactPhone" errors={fe?.contactPhone}>
          <Input id="contactPhone" name="contactPhone" defaultValue={lead.contactPhone ?? ""} />
        </Field>

        <Field label="Giá trị (VND)" htmlFor="value" errors={fe?.value}>
          <Input id="value" name="value" type="number" min="0" defaultValue={lead.value ?? ""} />
        </Field>

        <Field label="Trạng thái" htmlFor="status" errors={fe?.status}>
          <Select id="status" name="status" defaultValue={lead.status}>
            {Object.entries(LEAD_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Mức độ ưu tiên" htmlFor="priority" errors={fe?.priority}>
          <Select id="priority" name="priority" defaultValue={lead.priority}>
            {Object.entries(LEAD_PRIORITY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Nguồn" htmlFor="source" errors={fe?.source}>
          <Select id="source" name="source" defaultValue={lead.source}>
            {Object.entries(CUSTOMER_SOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Ngày dự kiến đóng" htmlFor="expectedCloseDate" errors={fe?.expectedCloseDate}>
          <Input id="expectedCloseDate" name="expectedCloseDate" type="date" defaultValue={expectedDate} />
        </Field>

        <Field label="Khách hàng liên kết" htmlFor="customerId" errors={fe?.customerId}>
          <Select id="customerId" name="customerId" defaultValue={lead.customer?.id ?? ""}>
            <option value="">— Không liên kết —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Giao cho" htmlFor="assignedToId" errors={fe?.assignedToId}>
          <Select id="assignedToId" name="assignedToId" defaultValue={lead.assignedTo?.id ?? ""}>
            <option value="">— Chưa giao —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </Select>
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

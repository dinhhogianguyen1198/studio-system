"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { createLeadAction, updateLeadAction } from "../../actions/lead.actions"
import type { ActionResult } from "@/shared/types/api.types"
import type { LeadDetail, LeadStatus, LeadPriority, CustomerSource } from "../../types/crm.types"
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
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {errors?.[0] && <p className="mt-1 text-xs text-destructive">{errors[0]}</p>}
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

  const [title, setTitle] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [value, setValue] = useState("")
  const [status, setStatus] = useState("NEW")
  const [priority, setPriority] = useState("MEDIUM")
  const [source, setSource] = useState("DIRECT")
  const [expectedCloseDate, setExpectedCloseDate] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [assignedToId, setAssignedToId] = useState("")

  useEffect(() => {
    if (state.success) {
      router.push(`/dashboard/leads/${state.data.id}`)
    }
  }, [state, router])

  const fe = !state.success ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-5">
      {!state.success && state.error && (
        <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Field label="Tiêu đề lead *" htmlFor="title" errors={fe?.title}>
        <Input
          id="title"
          name="title"
          placeholder="Lead từ sự kiện..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!fe?.title}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tên liên hệ *" htmlFor="contactName" errors={fe?.contactName}>
          <Input
            id="contactName"
            name="contactName"
            placeholder="Nguyễn Văn A"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            aria-invalid={!!fe?.contactName}
          />
        </Field>

        <Field label="Email liên hệ" htmlFor="contactEmail" errors={fe?.contactEmail}>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            placeholder="contact@email.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </Field>

        <Field label="SĐT liên hệ" htmlFor="contactPhone" errors={fe?.contactPhone}>
          <Input
            id="contactPhone"
            name="contactPhone"
            placeholder="0901234567"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </Field>

        <Field label="Giá trị (VND)" htmlFor="value" errors={fe?.value}>
          <Input
            id="value"
            name="value"
            type="number"
            min="0"
            placeholder="50000000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>

        <Field label="Trạng thái" htmlFor="status" errors={fe?.status}>
          <Select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {Object.entries(LEAD_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Mức độ ưu tiên" htmlFor="priority" errors={fe?.priority}>
          <Select
            id="priority"
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {Object.entries(LEAD_PRIORITY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Nguồn" htmlFor="source" errors={fe?.source}>
          <Select
            id="source"
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {Object.entries(CUSTOMER_SOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Ngày dự kiến đóng" htmlFor="expectedCloseDate" errors={fe?.expectedCloseDate}>
          <Input
            id="expectedCloseDate"
            name="expectedCloseDate"
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </Field>

        <Field label="Khách hàng liên kết" htmlFor="customerId" errors={fe?.customerId}>
          <Select
            id="customerId"
            name="customerId"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">— Không liên kết —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Giao cho" htmlFor="assignedToId" errors={fe?.assignedToId}>
          <Select
            id="assignedToId"
            name="assignedToId"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          >
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

  const [title, setTitle] = useState(lead.title)
  const [contactName, setContactName] = useState(lead.contactName)
  const [contactEmail, setContactEmail] = useState(lead.contactEmail ?? "")
  const [contactPhone, setContactPhone] = useState(lead.contactPhone ?? "")
  const [value, setValue] = useState(lead.value?.toString() ?? "")
  const [status, setStatus] = useState(lead.status)
  const [priority, setPriority] = useState(lead.priority)
  const [source, setSource] = useState(lead.source)
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toISOString().split("T")[0] : "",
  )
  const [customerId, setCustomerId] = useState(lead.customer?.id ?? "")
  const [assignedToId, setAssignedToId] = useState(lead.assignedTo?.id ?? "")

  useEffect(() => {
    if (state.success) {
      router.push(`/dashboard/leads/${lead.id}`)
    }
  }, [state, router, lead.id])

  const fe = !state.success ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-5">
      {!state.success && state.error && (
        <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Field label="Tiêu đề lead *" htmlFor="title" errors={fe?.title}>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!fe?.title}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tên liên hệ *" htmlFor="contactName" errors={fe?.contactName}>
          <Input
            id="contactName"
            name="contactName"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            aria-invalid={!!fe?.contactName}
          />
        </Field>

        <Field label="Email liên hệ" htmlFor="contactEmail" errors={fe?.contactEmail}>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </Field>

        <Field label="SĐT liên hệ" htmlFor="contactPhone" errors={fe?.contactPhone}>
          <Input
            id="contactPhone"
            name="contactPhone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </Field>

        <Field label="Giá trị (VND)" htmlFor="value" errors={fe?.value}>
          <Input
            id="value"
            name="value"
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>

        <Field label="Trạng thái" htmlFor="status" errors={fe?.status}>
          <Select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {Object.entries(LEAD_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Mức độ ưu tiên" htmlFor="priority" errors={fe?.priority}>
          <Select
            id="priority"
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as LeadPriority)}
          >
            {Object.entries(LEAD_PRIORITY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Nguồn" htmlFor="source" errors={fe?.source}>
          <Select
            id="source"
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value as CustomerSource)}
          >
            {Object.entries(CUSTOMER_SOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Ngày dự kiến đóng" htmlFor="expectedCloseDate" errors={fe?.expectedCloseDate}>
          <Input
            id="expectedCloseDate"
            name="expectedCloseDate"
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </Field>

        <Field label="Khách hàng liên kết" htmlFor="customerId" errors={fe?.customerId}>
          <Select
            id="customerId"
            name="customerId"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">— Không liên kết —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Giao cho" htmlFor="assignedToId" errors={fe?.assignedToId}>
          <Select
            id="assignedToId"
            name="assignedToId"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          >
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

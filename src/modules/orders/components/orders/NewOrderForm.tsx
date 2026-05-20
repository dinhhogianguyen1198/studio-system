"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { X, ArrowRight, User, CalendarDays, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActionResult } from "@/shared/types/api.types"
import type { SerializedServiceDefinitionSummary } from "@/modules/services/types/services.types"
import { createOrderWithItemsAction } from "@/modules/orders/actions/order.actions"
import { CustomerAutocompleteInput, type CustomerOption } from "./CustomerAutocompleteInput"
import { OrderItemsEditor, type OrderItemDraft } from "./OrderItemsEditor"
import { FinancialSummaryCard } from "./FinancialSummaryCard"

interface Props {
  customers: CustomerOption[]
  services: SerializedServiceDefinitionSummary[]
}

const FORM_ID = "new-order-form"
const VAT_RATE = 0.1

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-xs font-medium text-foreground"

const cardClass = "rounded-xl bg-card p-6 border border-border"

const textareaClass =
  "w-full resize-none rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-border bg-card px-3.5 pr-10 text-sm font-medium text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const ORDER_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Mới tạo" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
]

const initialState: ActionResult<{ id: string }> = { success: false, error: "" }

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </div>
  )
}

export function NewOrderForm({ customers, services }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createOrderWithItemsAction, initialState)

  // Customer contact state
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactAddress, setContactAddress] = useState("")

  // Order items / financials
  const [items, setItems] = useState<OrderItemDraft[]>([])
  const [discount, setDiscount] = useState(0)
  const [applyVat, setApplyVat] = useState(false)

  // Status & notes
  const [orderStatus, setOrderStatus] = useState("DRAFT")
  const [notes, setNotes] = useState("")
  const [internalNotes, setInternalNotes] = useState("")

  // Schedule dates
  const [shootingDate, setShootingDate] = useState("")
  const [rawPhotoSentDate, setRawPhotoSentDate] = useState("")
  const [selectionDate, setSelectionDate] = useState("")
  const [editedPhotoSentDate, setEditedPhotoSentDate] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const vatAmount = applyVat ? Math.round((subtotal - discount) * VAT_RATE) : 0
  const total = subtotal - discount + vatAmount

  useEffect(() => {
    if (state.success) {
      toast.success("Tạo đơn hàng thành công")
      router.push(`/dashboard/orders/${state.data.id}`)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  // Selecting a CRM customer fills all fields
  function handleSelectCustomer(customer: CustomerOption) {
    setSelectedCustomerId(customer.id)
    setContactName(customer.name)
    setContactPhone(customer.phone ?? "")
    setContactEmail(customer.email ?? "")
    setContactAddress(customer.address ?? "")
  }

  // Editing any field after linking breaks the CRM link
  function handleNameChange(value: string) {
    if (selectedCustomerId) setSelectedCustomerId("")
    setContactName(value)
  }

  function handlePhoneChange(value: string) {
    if (selectedCustomerId) setSelectedCustomerId("")
    setContactPhone(value)
  }

  function handleEmailChange(value: string) {
    if (selectedCustomerId) setSelectedCustomerId("")
    setContactEmail(value)
  }

  function handleAddressChange(value: string) {
    if (selectedCustomerId) setSelectedCustomerId("")
    setContactAddress(value)
  }

  const itemsForSubmit = items.map(({ _key: _k, serviceName: _n, ...rest }) => rest)

  return (
    <form id={FORM_ID} action={formAction} className="pb-28">
      <input type="hidden" name="itemsJson" value={JSON.stringify(itemsForSubmit)} />
      <input type="hidden" name="customerId" value={selectedCustomerId} />
      {/* Pass controlled values as hidden inputs since inputs are controlled by state */}
      <input type="hidden" name="contactEmail" value={contactEmail} />
      <input type="hidden" name="newCustomerAddress" value={contactAddress} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* ── LEFT COLUMN ─────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── 1. Thông tin khách hàng ── */}
          <div className={cardClass}>
            <SectionHeader
              icon={User}
              title="Thông tin khách hàng"
              subtitle="Nhập tên để tìm khách hàng CRM, hoặc nhập mới để tạo tự động"
            />

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="contactName" className={labelClass}>
                    Khách hàng <span className="text-destructive">*</span>
                  </label>
                  <CustomerAutocompleteInput
                    id="contactName"
                    customers={customers}
                    value={contactName}
                    linkedCustomerId={selectedCustomerId}
                    onChangeName={handleNameChange}
                    onSelect={handleSelectCustomer}
                    onUnlink={() => setSelectedCustomerId("")}
                    inputClass={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contactPhone" className={labelClass}>Số điện thoại</label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    placeholder="0901234567"
                    value={contactPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="contactEmailDisplay" className={labelClass}>Email</label>
                  <input
                    id="contactEmailDisplay"
                    type="email"
                    placeholder="email@example.com"
                    value={contactEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contactAddressDisplay" className={labelClass}>Địa chỉ</label>
                  <input
                    id="contactAddressDisplay"
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    value={contactAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Danh sách sản phẩm / dịch vụ ── */}
          <div className={cardClass}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Danh sách sản phẩm</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {items.length > 0
                    ? `${items.length} sản phẩm / dịch vụ đã chọn`
                    : "Thêm sản phẩm hoặc dịch vụ cho đơn hàng"}
                </p>
              </div>
              {items.length > 0 && (
                <span className="flex-shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-bold tabular-nums text-secondary-foreground">
                  {subtotal.toLocaleString("vi-VN")} ₫
                </span>
              )}
            </div>
            <OrderItemsEditor services={services} items={items} onChange={setItems} />
          </div>

          {/* ── 3. Trạng thái & Ghi chú ── */}
          <div className={cardClass}>
            <h2 className="mb-5 text-base font-semibold text-foreground">Trạng thái & Ghi chú</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="orderStatus" className={labelClass}>Trạng thái đơn hàng</label>
                <div className="relative">
                  <select
                    id="orderStatus"
                    name="status"
                    className={cn(selectClass, "font-semibold")}
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                  >
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="notes" className={labelClass}>Ghi chú khách hàng</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Yêu cầu của khách hàng..."
                  className={textareaClass}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="internalNotes" className={labelClass}>Ghi chú nội bộ</label>
                <textarea
                  id="internalNotes"
                  name="internalNotes"
                  rows={2}
                  placeholder="Ghi chú dành cho nhân viên..."
                  className={textareaClass}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Lịch trình đơn hàng ── */}
          <div className={cardClass}>
            <SectionHeader icon={CalendarDays} title="Lịch trình đơn hàng" />

            <div className="space-y-4">
              {[
                { id: "shootingDate", name: "shootingDate", label: "Ngày chụp", value: shootingDate, onChange: setShootingDate },
                { id: "rawPhotoSentDate", name: "rawPhotoSentDate", label: "Ngày gửi ảnh gốc", value: rawPhotoSentDate, onChange: setRawPhotoSentDate },
                { id: "selectionDate", name: "selectionDate", label: "Ngày khách chọn ảnh", value: selectionDate, onChange: setSelectionDate },
                { id: "editedPhotoSentDate", name: "editedPhotoSentDate", label: "Ngày gửi ảnh chỉnh sửa", value: editedPhotoSentDate, onChange: setEditedPhotoSentDate },
                { id: "deliveryDate", name: "deliveryDate", label: "Ngày giao ảnh", value: deliveryDate, onChange: setDeliveryDate },
              ].map(({ id, name, label, value, onChange }) => (
                <div key={id} className="space-y-1.5">
                  <label htmlFor={id} className={labelClass}>{label}</label>
                  <input
                    id={id}
                    name={name}
                    type="date"
                    className={cn(inputClass, "cursor-pointer")}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Tài chính ── */}
          <FinancialSummaryCard
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
            applyVat={applyVat}
            onApplyVatChange={setApplyVat}
            vatAmount={vatAmount}
            total={total}
          />
        </div>
      </div>

      {/* ── STICKY ACTION BAR ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/80 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Hủy
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            disabled={isPending}
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground",
              "transition-all hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isPending ? "Đang lưu..." : <>Lưu đơn hàng <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </form>
  )
}

"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { X, ArrowRight, User, PartyPopper, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActionResult } from "@/shared/types/api.types"
import type { SerializedServiceDefinitionSummary } from "@/modules/services/types/services.types"
import type { OrderManagementUnitSummary } from "@/modules/orders/types/order-management-unit.types"
import { createOrderWithItemsAction } from "@/modules/orders/actions/order.actions"
import { CustomerAutocompleteInput, type CustomerOption } from "./CustomerAutocompleteInput"
import { OrderItemsEditor, type OrderItemDraft } from "./OrderItemsEditor"
import { FinancialSummaryCard } from "./FinancialSummaryCard"

interface Props {
  customers: CustomerOption[]
  services: SerializedServiceDefinitionSummary[]
  managementUnits: OrderManagementUnitSummary[]
}

const FORM_ID = "new-order-form"
const VAT_RATE = 0.1

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-xs font-medium text-foreground"

const cardClass = "rounded-xl bg-card p-6 border border-border"

const textareaClass =
  "w-full resize-none rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"


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

export function NewOrderForm({ customers, services, managementUnits }: Props) {
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
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [applyVat, setApplyVat] = useState(false)

  // Order info (party + notes + management unit)
  const [partyName, setPartyName] = useState("")
  const [notes, setNotes] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [orderManagementUnitId, setOrderManagementUnitId] = useState("")

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

  function handleSelectCustomer(customer: CustomerOption) {
    setSelectedCustomerId(customer.id)
    setContactName(customer.name)
    setContactPhone(customer.phone ?? "")
    setContactEmail(customer.email ?? "")
    setContactAddress(customer.address ?? "")
  }

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

  const itemsForSubmit = items.map(({ _key: _k, serviceName: _n, defaultDurationDays: _d, ...rest }) => rest)

  return (
    <form id={FORM_ID} action={formAction} className="pb-28">
      <input type="hidden" name="itemsJson" value={JSON.stringify(itemsForSubmit)} />
      <input type="hidden" name="customerId" value={selectedCustomerId} />
      <input type="hidden" name="contactEmail" value={contactEmail} />
      <input type="hidden" name="newCustomerAddress" value={contactAddress} />
      <input type="hidden" name="partyName" value={partyName} />
      <input type="hidden" name="orderManagementUnitId" value={orderManagementUnitId} />

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

          {/* ── 2. Thông tin đơn hàng ── */}
          <div className={cardClass}>
            <SectionHeader
              icon={PartyPopper}
              title="Thông tin đơn hàng"
              subtitle="Thông tin chung về sự kiện / tiệc"
            />
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="partyNameInput" className={labelClass}>Tên tiệc</label>
                  <input
                    id="partyNameInput"
                    placeholder="VD: Tiệc cưới Anh - Minh, Sinh nhật bé An..."
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="orderManagementUnitSelect" className={labelClass}>
                    Đơn vị quản lý
                  </label>
                  <select
                    id="orderManagementUnitSelect"
                    value={orderManagementUnitId}
                    onChange={(e) => setOrderManagementUnitId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— Chọn đơn vị —</option>
                    {managementUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
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

          {/* ── 3. Danh sách dịch vụ ── */}
          <div className={cardClass}>
            {/* Header with inline "Thêm dịch vụ" button */}
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Danh sách dịch vụ</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {items.length > 0 ? `${items.length} dịch vụ đã chọn` : "Chưa có dịch vụ nào"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm dịch vụ
              </button>
            </div>
            <OrderItemsEditor
              services={services}
              items={items}
              onChange={setItems}
              isPickerOpen={isPickerOpen}
              onPickerOpenChange={setIsPickerOpen}
            />
          </div>

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────── */}
        <div className="space-y-6">
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

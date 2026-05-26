"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { X, ArrowRight, Plus } from "lucide-react"
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
  "h-9 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-xs font-medium text-muted-foreground"

const textareaClass =
  "w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const initialState: ActionResult<{ id: string }> = { success: false, error: "" }

function StepBadge({ step }: { step: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
      {step}
    </span>
  )
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {children}
    </div>
  )
}

export function NewOrderForm({ customers, services, managementUnits }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createOrderWithItemsAction, initialState)

  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactAddress, setContactAddress] = useState("")

  const [items, setItems] = useState<OrderItemDraft[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [applyVat, setApplyVat] = useState(false)

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
    <form id={FORM_ID} action={formAction} className="pb-24">
      {/* Hidden form fields */}
      <input type="hidden" name="itemsJson" value={JSON.stringify(itemsForSubmit)} />
      <input type="hidden" name="customerId" value={selectedCustomerId} />
      <input type="hidden" name="contactEmail" value={contactEmail} />
      <input type="hidden" name="newCustomerAddress" value={contactAddress} />
      <input type="hidden" name="partyName" value={partyName} />
      <input type="hidden" name="orderManagementUnitId" value={orderManagementUnitId} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* ① Khách hàng */}
          <SectionCard>
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <StepBadge step={1} />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Khách hàng</h2>
                <p className="text-xs text-muted-foreground">Tìm trong CRM hoặc nhập mới — hệ thống tự tạo nếu chưa có</p>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="contactName" className={labelClass}>
                    Tên khách hàng <span className="text-destructive">*</span>
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
                    placeholder="0901 234 567"
                    value={contactPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="123 Đường ABC, Quận 1..."
                    value={contactAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ② Thông tin đơn hàng */}
          <SectionCard>
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <StepBadge step={2} />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Thông tin đơn hàng</h2>
                <p className="text-xs text-muted-foreground">Sự kiện, đơn vị quản lý và ghi chú</p>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="partyNameInput" className={labelClass}>Tên sự kiện</label>
                  <input
                    id="partyNameInput"
                    placeholder="Tiệc cưới Anh – Minh, Sinh nhật bé An..."
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="orderManagementUnitSelect" className={labelClass}>Đơn vị quản lý</label>
                  <select
                    id="orderManagementUnitSelect"
                    value={orderManagementUnitId}
                    onChange={(e) => setOrderManagementUnitId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— Chọn đơn vị —</option>
                    {managementUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes — 2 columns */}
              <div className="grid grid-cols-2 gap-3">
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
                    rows={3}
                    placeholder="Lưu ý dành cho nhân viên..."
                    className={textareaClass}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ③ Dịch vụ */}
          <SectionCard>
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <StepBadge step={3} />
              <div className="flex flex-1 items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Dịch vụ</h2>
                  <p className="text-xs text-muted-foreground">
                    {items.length > 0
                      ? `${items.length} dịch vụ · ${subtotal.toLocaleString("vi-VN")} ₫`
                      : "Chưa có dịch vụ nào được chọn"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm dịch vụ
                </button>
              </div>
            </div>
            <div className="p-5">
              <OrderItemsEditor
                services={services}
                items={items}
                onChange={setItems}
                isPickerOpen={isPickerOpen}
                onPickerOpenChange={setIsPickerOpen}
              />
            </div>
          </SectionCard>

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div>
          <FinancialSummaryCard
            items={items}
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

      {/* ── STICKY ACTION BAR ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Hủy
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            disabled={isPending}
            className={cn(
              "flex h-9 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground",
              "transition-all hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isPending ? (
              "Đang lưu..."
            ) : (
              <>
                Lưu đơn hàng
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { PartyPopper, Pencil, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActionResult } from "@/shared/types/api.types"
import type { OrderManagementUnitSummary } from "@/modules/orders/types/order-management-unit.types"
import { updateOrderAction } from "@/modules/orders/actions/order.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  orderId: string
  defaultValues: {
    partyName?: string | null
    notes?: string | null
    internalNotes?: string | null
    orderManagementUnitId?: string | null
    orderManagementUnitName?: string | null
  }
  managementUnits: OrderManagementUnitSummary[]
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-xs font-medium text-foreground"

const textareaClass =
  "w-full resize-none rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const initialState: ActionResult<void> = { success: false, error: "" }

export function OrderDetailInfoForm({ orderId, defaultValues, managementUnits }: Props) {
  const boundAction = updateOrderAction.bind(null, orderId)
  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  const [isEditing, setIsEditing] = useState(false)
  const [partyName, setPartyName] = useState(defaultValues.partyName ?? "")
  const [notes, setNotes] = useState(defaultValues.notes ?? "")
  const [internalNotes, setInternalNotes] = useState(defaultValues.internalNotes ?? "")
  const [orderManagementUnitId, setOrderManagementUnitId] = useState(
    defaultValues.orderManagementUnitId ?? "",
  )

  const selectedUnit = managementUnits.find((u) => u.id === orderManagementUnitId)

  useEffect(() => {
    if (state.success) {
      toast.success("Đã lưu thay đổi")
      setIsEditing(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  function handleCancel() {
    setPartyName(defaultValues.partyName ?? "")
    setNotes(defaultValues.notes ?? "")
    setInternalNotes(defaultValues.internalNotes ?? "")
    setOrderManagementUnitId(defaultValues.orderManagementUnitId ?? "")
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PartyPopper className="size-4 text-primary" />
            Thông tin đơn hàng
          </CardTitle>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
              Chỉnh sửa
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {!isEditing ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className={cn(labelClass, "mb-0.5")}>Tên tiệc</p>
              <p className={cn("text-foreground", !partyName && "italic text-muted-foreground")}>
                {partyName || "Chưa có"}
              </p>
            </div>

            <div>
              <p className={cn(labelClass, "mb-0.5")}>Đơn vị quản lý</p>
              <p className={cn("text-foreground", !(selectedUnit?.name ?? defaultValues.orderManagementUnitName) && "italic text-muted-foreground")}>
                {selectedUnit?.name ?? defaultValues.orderManagementUnitName ?? "Chưa có"}
              </p>
            </div>

            <div>
              <p className={cn(labelClass, "mb-0.5")}>Ghi chú khách hàng</p>
              <p className={cn("whitespace-pre-wrap text-foreground", !notes && "italic text-muted-foreground")}>
                {notes || "Chưa có"}
              </p>
            </div>

            <div>
              <p className={cn(labelClass, "mb-0.5")}>Ghi chú nội bộ</p>
              <p className={cn("whitespace-pre-wrap text-foreground", !internalNotes && "italic text-muted-foreground")}>
                {internalNotes || "Chưa có"}
              </p>
            </div>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="partyName" value={partyName} />
            <input type="hidden" name="orderManagementUnitId" value={orderManagementUnitId} />

            <div className="space-y-1.5">
              <label htmlFor="detail-partyName" className={labelClass}>Tên tiệc</label>
              <input
                id="detail-partyName"
                placeholder="VD: Tiệc cưới Anh - Minh, Sinh nhật bé An..."
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="detail-managementUnit" className={labelClass}>Đơn vị quản lý</label>
              <select
                id="detail-managementUnit"
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

            <div className="space-y-1.5">
              <label htmlFor="detail-notes" className={labelClass}>Ghi chú khách hàng</label>
              <textarea
                id="detail-notes"
                name="notes"
                rows={3}
                placeholder="Yêu cầu của khách hàng..."
                className={textareaClass}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="detail-internalNotes" className={labelClass}>Ghi chú nội bộ</label>
              <textarea
                id="detail-internalNotes"
                name="internalNotes"
                rows={2}
                placeholder="Ghi chú dành cho nhân viên..."
                className={textareaClass}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={cn(
                  "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground",
                  "transition-all hover:bg-primary/90",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <Save className="h-3.5 w-3.5" />
                {isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

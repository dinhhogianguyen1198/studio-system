"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActionResult } from "@/shared/types/api.types"
import { updateOrderAction } from "@/modules/orders/actions/order.actions"

interface Props {
  orderId: string
  defaultValues: {
    partyName?: string | null
    notes?: string | null
    internalNotes?: string | null
  }
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const labelClass = "block text-xs font-medium text-foreground"

const textareaClass =
  "w-full resize-none rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"

const initialState: ActionResult<void> = { success: false, error: "" }

export function OrderDetailInfoForm({ orderId, defaultValues }: Props) {
  const boundAction = updateOrderAction.bind(null, orderId)
  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  const [partyName, setPartyName] = useState(defaultValues.partyName ?? "")
  const [notes, setNotes] = useState(defaultValues.notes ?? "")
  const [internalNotes, setInternalNotes] = useState(defaultValues.internalNotes ?? "")

  useEffect(() => {
    if (state.success) {
      toast.success("Đã lưu thay đổi")
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="partyName" value={partyName} />

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

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground",
          "transition-all hover:bg-primary/90",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <Save className="h-3.5 w-3.5" />
        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  )
}

"use client"

import { useState, useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"
import { transitionOrderItemAction } from "../actions/workflow-transition.actions"

interface Transition {
  id: string
  toStepId: string
  label: string | null
  requireNote: boolean
  toStep: { id: string; key: string; name: string; color: string | null; isFinal: boolean }
}

interface Props {
  orderItemId: string
  orderId: string
  transitions: Transition[]
}

const initialState: ActionResult<void> = { success: false, error: "" }

function TransitionButton({
  transition,
  orderItemId,
  orderId,
}: {
  transition: Transition
  orderItemId: string
  orderId: string
}) {
  const [open, setOpen] = useState(false)
  const action = transitionOrderItemAction.bind(null, orderId)
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success(`Chuyển sang "${transition.toStep.name}" thành công`)
      setOpen(false)
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, transition.toStep.name])

  const label = transition.label ?? `→ ${transition.toStep.name}`

  if (!transition.requireNote) {
    return (
      <form action={formAction}>
        <input type="hidden" name="orderItemId" value={orderItemId} />
        <input type="hidden" name="targetStepId" value={transition.toStepId} />
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          {isPending ? "Đang xử lý..." : label}
        </Button>
      </form>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Chuyển sang: {transition.toStep.name}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderItemId" value={orderItemId} />
          <input type="hidden" name="targetStepId" value={transition.toStepId} />
          <div className="space-y-1.5">
            <label htmlFor="note" className="block text-sm font-medium">
              Ghi chú <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="note"
              name="note"
              rows={3}
              required
              placeholder="Nhập ghi chú bắt buộc..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function WorkflowStepTransitionButtons({ orderItemId, orderId, transitions }: Props) {
  if (transitions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((t) => (
        <TransitionButton
          key={t.id}
          transition={t}
          orderItemId={orderItemId}
          orderId={orderId}
        />
      ))}
    </div>
  )
}

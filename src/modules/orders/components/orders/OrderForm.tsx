"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"

interface CustomerOption {
  id: string
  name: string
  phone: string | null
}

interface Props {
  action: (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>
  customers: CustomerOption[]
  submitLabel?: string
}

const initialState: ActionResult<{ id: string }> = { success: false, error: "" }

export function OrderForm({ action, customers, submitLabel = "Tạo đơn hàng" }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) toast.success("Tạo đơn hàng thành công")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="customerId" className="block text-sm font-medium">
          Khách hàng
        </label>
        <Select name="customerId" id="customerId" defaultValue="">
          <option value="">Không liên kết khách hàng</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.phone ? `— ${c.phone}` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contactName" className="block text-sm font-medium">
            Tên liên hệ <span className="text-red-500">*</span>
          </label>
          <Input id="contactName" name="contactName" placeholder="Nguyễn Văn A" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contactPhone" className="block text-sm font-medium">
            Số điện thoại
          </label>
          <Input id="contactPhone" name="contactPhone" placeholder="0901234567" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contactEmail" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          placeholder="email@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="discountAmount" className="block text-sm font-medium">
          Giảm giá (VND)
        </label>
        <Input
          id="discountAmount"
          name="discountAmount"
          type="number"
          min={0}
          step={1000}
          defaultValue={0}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium">
          Ghi chú khách hàng
        </label>
        <Textarea id="notes" name="notes" placeholder="Yêu cầu của khách hàng..." rows={3} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="internalNotes" className="block text-sm font-medium">
          Ghi chú nội bộ
        </label>
        <Textarea
          id="internalNotes"
          name="internalNotes"
          placeholder="Ghi chú dành cho nhân viên..."
          rows={2}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang tạo..." : submitLabel}
      </Button>
    </form>
  )
}

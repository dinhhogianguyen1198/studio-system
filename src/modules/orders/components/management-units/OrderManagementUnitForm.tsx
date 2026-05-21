"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"
import type { OrderManagementUnitSummary } from "../../types/order-management-unit.types"

interface Props {
  action: (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>
  defaultValues?: Partial<OrderManagementUnitSummary>
  submitLabel?: string
  onSuccess?: () => void
}

const initialState: ActionResult<{ id: string }> = { success: false, error: "" }

export function OrderManagementUnitForm({
  action,
  defaultValues,
  submitLabel = "Tạo đơn vị",
  onSuccess,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState)

  const [name, setName] = useState(defaultValues?.name ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")
  const [sortOrder, setSortOrder] = useState(defaultValues?.sortOrder?.toString() ?? "0")
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true)

  useEffect(() => {
    if (state.success) {
      toast.success("Lưu thành công")
      onSuccess?.()
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium">
          Tên đơn vị <span className="text-destructive">*</span>
        </label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Studio A, Nhóm Bắc, Chi nhánh Q1..."
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium">
          Mô tả
        </label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về đơn vị quản lý..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="sortOrder" className="block text-sm font-medium">
            Thứ tự hiển thị
          </label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            value="true"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Hoạt động
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang lưu..." : submitLabel}
      </Button>
    </form>
  )
}

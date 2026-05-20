"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/shared/types/api.types"
import type { SerializedServiceDefinitionDetail } from "../../types/services.types"
import type { WorkflowTemplateSummary } from "@/modules/workflow/types/workflow.types"

interface Props {
  action: (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>
  defaultValues?: Partial<SerializedServiceDefinitionDetail>
  workflowTemplates: WorkflowTemplateSummary[]
  submitLabel?: string
  onSuccess?: () => void
}

const initialState: ActionResult<{ id: string }> = { success: false, error: "" }

function formatPrice(raw: string): string {
  if (!raw) return ""
  const num = parseInt(raw, 10)
  if (isNaN(num)) return ""
  return num.toLocaleString("vi-VN")
}

export function ServiceDefinitionForm({
  action,
  defaultValues,
  workflowTemplates,
  submitLabel = "Tạo dịch vụ",
  onSuccess,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState)

  const [name, setName] = useState(defaultValues?.name ?? "")
  const [slug, setSlug] = useState(defaultValues?.slug ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")
  const [priceRaw, setPriceRaw] = useState(defaultValues?.defaultPrice?.toString() ?? "")
  const [priceDisplay, setPriceDisplay] = useState(
    defaultValues?.defaultPrice ? formatPrice(defaultValues.defaultPrice.toString()) : "",
  )
  const [durationDays, setDurationDays] = useState(
    defaultValues?.defaultDurationDays?.toString() ?? "3",
  )
  const [slaHours, setSlaHours] = useState(defaultValues?.defaultSlaHours?.toString() ?? "72")
  const [workflowTemplateId, setWorkflowTemplateId] = useState(
    defaultValues?.workflowTemplate?.id ?? "",
  )
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

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const digits = e.target.value.replace(/[^\d]/g, "")
    setPriceRaw(digits)
    setPriceDisplay(formatPrice(digits))
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium">
            Tên dịch vụ <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Chụp ảnh sản phẩm"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="slug" className="block text-sm font-medium">
            Slug <span className="text-red-500">*</span>
          </label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="chup-anh-san-pham"
            className="font-mono"
            required
          />
        </div>
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
          placeholder="Mô tả chi tiết về dịch vụ..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="defaultPrice" className="block text-sm font-medium">
            Giá mặc định (VND) <span className="text-red-500">*</span>
          </label>
          <input type="hidden" name="defaultPrice" value={priceRaw} />
          <Input
            id="defaultPrice"
            type="text"
            inputMode="numeric"
            value={priceDisplay}
            onChange={handlePriceChange}
            placeholder="1.000.000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="defaultDurationDays" className="block text-sm font-medium">
            Thời lượng (ngày)
          </label>
          <Input
            id="defaultDurationDays"
            name="defaultDurationDays"
            type="number"
            min={1}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="defaultSlaHours" className="block text-sm font-medium">
            SLA (giờ)
          </label>
          <Input
            id="defaultSlaHours"
            name="defaultSlaHours"
            type="number"
            min={1}
            value={slaHours}
            onChange={(e) => setSlaHours(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="workflowTemplateId" className="block text-sm font-medium">
          Workflow template
        </label>
        <Select
          id="workflowTemplateId"
          name="workflowTemplateId"
          value={workflowTemplateId}
          onChange={(e) => setWorkflowTemplateId(e.target.value)}
        >
          <option value="">Không gán workflow</option>
          {workflowTemplates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name} ({tpl.steps.length} bước)
            </option>
          ))}
        </Select>
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

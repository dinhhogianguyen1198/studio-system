"use client"

import { useActionState, useEffect } from "react"
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
}

const initialState: ActionResult<{ id: string }> = { success: false, error: "" }

export function ServiceDefinitionForm({
  action,
  defaultValues,
  workflowTemplates,
  submitLabel = "Tạo dịch vụ",
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) toast.success("Lưu thành công")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])

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
            defaultValue={defaultValues?.name}
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
            defaultValue={defaultValues?.slug}
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
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Mô tả chi tiết về dịch vụ..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="defaultPrice" className="block text-sm font-medium">
            Giá mặc định (VND) <span className="text-red-500">*</span>
          </label>
          <Input
            id="defaultPrice"
            name="defaultPrice"
            type="number"
            min={0}
            step={1000}
            defaultValue={defaultValues?.defaultPrice ?? ""}
            placeholder="1000000"
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
            defaultValue={defaultValues?.defaultDurationDays ?? 3}
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
            defaultValue={defaultValues?.defaultSlaHours ?? 72}
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
          defaultValue={defaultValues?.workflowTemplate?.id ?? ""}
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
            defaultValue={defaultValues?.sortOrder ?? 0}
          />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            value="true"
            defaultChecked={defaultValues?.isActive ?? true}
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

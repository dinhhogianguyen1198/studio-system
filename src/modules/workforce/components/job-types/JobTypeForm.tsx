"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { JobTypeSummary } from "@/modules/workforce/types/workforce.types"
import type { ActionResult } from "@/shared/types/api.types"

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface Props {
  action: (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>
  defaultValues?: Partial<JobTypeSummary>
  onSuccess?: () => void
}

export function JobTypeForm({ action, defaultValues, onSuccess }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    error: "",
  })

  const [name, setName] = useState(defaultValues?.name ?? "")
  const [slug, setSlug] = useState(defaultValues?.slug ?? "")
  const [color, setColor] = useState(defaultValues?.color ?? "#6B7280")
  const [sortOrder, setSortOrder] = useState(String(defaultValues?.sortOrder ?? 0))
  const [description, setDescription] = useState(defaultValues?.description ?? "")

  useEffect(() => {
    if (state.success && "data" in state) {
      toast.success("Lưu thành công")
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/workforce/job-types")
      }
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, router, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="isActive" value="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jt-name">Tên *</Label>
          <Input
            id="jt-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhiếp ảnh gia"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jt-slug">Slug *</Label>
          <div className="flex gap-2">
            <Input
              id="jt-slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="nhiep-anh-gia"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setSlug(generateSlug(name))}
              title="Tạo slug từ tên"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jt-color">Màu sắc</Label>
          <div className="flex items-center gap-3">
            <input
              id="jt-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded-md border border-input p-1"
            />
            <span className="text-sm font-mono text-muted-foreground">{color}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jt-sortOrder">Thứ tự sắp xếp</Label>
          <Input
            id="jt-sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jt-description">Mô tả</Label>
        <Textarea
          id="jt-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Mô tả ngắn về loại công việc..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onSuccess ? onSuccess() : router.back())}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </form>
  )
}

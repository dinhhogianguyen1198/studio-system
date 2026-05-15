"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { JobTypeSummary } from "@/modules/workforce/types/workforce.types"
import type { ActionResult } from "@/shared/types/api.types"

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// Internal form values — all strings/primitives before server-side coercion
interface JobTypeFormValues {
  name: string
  slug: string
  color: string
  isActive: boolean
  sortOrder: number
  description: string
}

interface Props {
  action: (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>
  defaultValues?: Partial<JobTypeSummary>
  redirectTo?: string
}

export function JobTypeForm({ action, defaultValues, redirectTo }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    error: "",
  })

  const form = useForm<JobTypeFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      color: defaultValues?.color ?? "#6B7280",
      isActive: defaultValues?.isActive ?? true,
      sortOrder: defaultValues?.sortOrder ?? 0,
      description: defaultValues?.description ?? "",
    },
  })

  useEffect(() => {
    if (state.success && "data" in state) {
      toast.success("Lưu thành công")
      router.push(redirectTo ?? "/dashboard/workforce/job-types")
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, router, redirectTo])

  function handleGenerateSlug() {
    const name = form.getValues("name")
    form.setValue("slug", generateSlug(name), { shouldValidate: true })
  }

  const nameError = form.formState.errors.name
  const slugError = form.formState.errors.slug

  return (
    <form action={formAction} className="space-y-6">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin loại công việc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jt-name">Tên *</Label>
              <Input
                id="jt-name"
                {...form.register("name", { required: "Tên không được trống" })}
                name="name"
                placeholder="Nhiếp ảnh gia"
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jt-slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="jt-slug"
                  {...form.register("slug", {
                    required: "Slug không được trống",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Slug chỉ chứa chữ thường, số và gạch ngang",
                    },
                  })}
                  name="slug"
                  placeholder="nhiep-anh-gia"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateSlug}
                  title="Tạo slug từ tên"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {slugError && (
                <p className="text-sm text-destructive">{slugError.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jt-color">Màu sắc</Label>
              <div className="flex items-center gap-3">
                <Controller
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <>
                      <input
                        id="jt-color"
                        type="color"
                        value={field.value}
                        onChange={field.onChange}
                        className="h-9 w-16 cursor-pointer rounded-md border border-input p-1"
                      />
                      <input type="hidden" name="color" value={field.value} />
                      <span className="text-sm font-mono text-muted-foreground">
                        {field.value}
                      </span>
                    </>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jt-sortOrder">Thứ tự sắp xếp</Label>
              <Input
                id="jt-sortOrder"
                type="number"
                min="0"
                {...form.register("sortOrder", { valueAsNumber: true })}
                name="sortOrder"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jt-description">Mô tả</Label>
            <Textarea
              id="jt-description"
              {...form.register("description")}
              name="description"
              rows={3}
              placeholder="Mô tả ngắn về loại công việc..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <>
                  <input
                    type="hidden"
                    name="isActive"
                    value={field.value ? "true" : "false"}
                  />
                  <Switch
                    id="jt-isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </>
              )}
            />
            <Label htmlFor="jt-isActive">Đang hoạt động</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </form>
  )
}

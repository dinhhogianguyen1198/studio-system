"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  JobTypeSummary,
  WorkerDetail,
} from "@/modules/workforce/types/workforce.types"
import type { ActionResult } from "@/shared/types/api.types"

// Internal form state uses raw strings (pre-transform) to match what the
// server action receives from FormData.
interface WorkerFormValues {
  name: string
  phone: string
  email: string
  notes: string
  isActive: boolean
  selectedJobTypeIds: string[]
  primaryJobTypeId: string
}

interface Props {
  action: (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>
  jobTypes: JobTypeSummary[]
  defaultValues?: Partial<WorkerDetail>
  redirectTo?: string
}

export function WorkerForm({
  action,
  jobTypes,
  defaultValues,
  redirectTo,
}: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    error: "",
  })

  const form = useForm<WorkerFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      notes: defaultValues?.notes ?? "",
      isActive: defaultValues?.isActive ?? true,
      selectedJobTypeIds:
        defaultValues?.jobTypes?.map((wjt) => wjt.jobType.id) ?? [],
      primaryJobTypeId:
        defaultValues?.jobTypes?.find((wjt) => wjt.isPrimary)?.jobType.id ??
        "",
    },
  })

  useEffect(() => {
    if (state.success && "data" in state) {
      toast.success("Lưu thành công")
      router.push(
        redirectTo ?? `/dashboard/workforce/workers/${state.data.id}`,
      )
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, router, redirectTo])

  const selectedJobTypeIds = form.watch("selectedJobTypeIds")
  const nameError = form.formState.errors.name

  return (
    <form action={formAction} className="space-y-6">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      {/* Pass selectedJobTypeIds as comma-separated string for FormData */}
      <input
        type="hidden"
        name="jobTypeIds"
        value={selectedJobTypeIds.join(",")}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Họ tên *</Label>
              <Input
                id="name"
                {...form.register("name", { required: "Tên không được trống" })}
                name="name"
                placeholder="Nguyễn Văn A"
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                name="phone"
                placeholder="0901234567"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              name="email"
              placeholder="worker@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              name="notes"
              rows={3}
              placeholder="Ghi chú nội bộ..."
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
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </>
              )}
            />
            <Label htmlFor="isActive">Đang hoạt động</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kỹ năng / Vai trò</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {jobTypes.map((jt) => {
              const isChecked = selectedJobTypeIds.includes(jt.id)
              return (
                <label
                  key={jt.id}
                  className="flex items-center gap-2 cursor-pointer rounded-lg border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...selectedJobTypeIds, jt.id]
                        : selectedJobTypeIds.filter((id: string) => id !== jt.id)
                      form.setValue("selectedJobTypeIds", next)
                    }}
                  />
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: jt.color }}
                  />
                  <span className="text-sm font-medium">{jt.name}</span>
                </label>
              )
            })}
          </div>
          {selectedJobTypeIds.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="primaryJobTypeId">Vai trò chính</Label>
              <select
                id="primaryJobTypeId"
                {...form.register("primaryJobTypeId")}
                name="primaryJobTypeId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Không chọn</option>
                {jobTypes
                  .filter((jt) => selectedJobTypeIds.includes(jt.id))
                  .map((jt) => (
                    <option key={jt.id} value={jt.id}>
                      {jt.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
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

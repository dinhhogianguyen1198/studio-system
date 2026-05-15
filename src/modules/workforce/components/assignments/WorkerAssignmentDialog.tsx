"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import {
  assignWorkerSchema,
  type AssignWorkerInput,
} from "@/modules/workforce/schemas/workforce.schema"
import { assignWorkerAction } from "@/modules/workforce/actions/worker-assignment.actions"
import type { WorkerSummary } from "@/modules/workforce/types/workforce.types"

interface Props {
  orderItemId: string
  orderItemName: string
  workers: WorkerSummary[]
  children: React.ReactNode
}

export function WorkerAssignmentDialog({
  orderItemId,
  orderItemName,
  workers,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssignWorkerInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(assignWorkerSchema) as any,
    defaultValues: { orderItemId, workerId: "", jobTypeId: "", quantity: 1, notes: "" },
  })

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId)
  const availableJobTypes = selectedWorker?.jobTypes.map((wjt) => wjt.jobType) ?? []

  function handleWorkerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value
    setSelectedWorkerId(v)
    setValue("workerId", v)
    setValue("jobTypeId", "")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onSubmit(data: any) {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => fd.set(k, String(v ?? "")))
      const result = await assignWorkerAction({ success: false, error: "" }, fd)
      if (result.success) {
        toast.success("Đã phân công nhân viên")
        setOpen(false)
        reset({ orderItemId, workerId: "", jobTypeId: "", quantity: 1, notes: "" })
        setSelectedWorkerId("")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Phân công nhân viên</DialogTitle>
          <p className="text-sm text-muted-foreground">{orderItemName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("orderItemId")} />

          <div className="space-y-2">
            <Label htmlFor="wa-workerId">Nhân viên *</Label>
            <Select
              id="wa-workerId"
              {...register("workerId")}
              onChange={handleWorkerChange}
            >
              <option value="">Chọn nhân viên...</option>
              {workers.map((w) => {
                const primary = w.jobTypes.find((jt) => jt.isPrimary)
                return (
                  <option key={w.id} value={w.id}>
                    {w.name}
                    {primary ? ` (${primary.jobType.name})` : ""}
                  </option>
                )
              })}
            </Select>
            {errors.workerId && (
              <p className="text-sm text-destructive">{errors.workerId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-jobTypeId">Vai trò *</Label>
            <Select
              id="wa-jobTypeId"
              {...register("jobTypeId")}
              disabled={!selectedWorkerId}
            >
              <option value="">
                {selectedWorkerId ? "Chọn vai trò..." : "Chọn nhân viên trước"}
              </option>
              {availableJobTypes.map((jt) => (
                <option key={jt.id} value={jt.id}>
                  {jt.name}
                </option>
              ))}
            </Select>
            {errors.jobTypeId && (
              <p className="text-sm text-destructive">{errors.jobTypeId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-quantity">Số lượng *</Label>
            <Input
              id="wa-quantity"
              type="number"
              step="0.5"
              min="0.5"
              {...register("quantity")}
              placeholder="1"
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-notes">Ghi chú</Label>
            <Textarea
              id="wa-notes"
              {...register("notes")}
              rows={2}
              placeholder="Ghi chú thêm..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang phân công..." : "Phân công"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

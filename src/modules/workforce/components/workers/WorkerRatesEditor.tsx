"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  upsertWorkerRateAction,
  deactivateWorkerRateAction,
} from "@/modules/workforce/actions/worker-rate.actions"
import {
  RateType,
  RATE_TYPE_LABELS,
  type WorkerDetail,
  type JobTypeSummary,
} from "@/modules/workforce/types/workforce.types"

type ActiveRate = WorkerDetail["rates"][number]

interface Props {
  workerId: string
  rates: ActiveRate[]
  jobTypes: JobTypeSummary[]
}

function formatAmount(amount: number | { toString(): string }, currency: string) {
  const num = typeof amount === "number" ? amount : parseFloat(amount.toString())
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
  }).format(num)
}

function AddRateForm({
  workerId,
  jobTypes,
  onCancel,
}: {
  workerId: string
  jobTypes: JobTypeSummary[]
  onCancel: () => void
}) {
  const [state, formAction, isPending] = useActionState(upsertWorkerRateAction, {
    success: false,
    error: "",
  })

  useEffect(() => {
    if (state.success) {
      toast.success("Đã lưu mức lương")
      onCancel()
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state, onCancel])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <input type="hidden" name="workerId" value={workerId} />
      <input type="hidden" name="currency" value="VND" />

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="rate-jobTypeId">Loại công việc *</Label>
          <select
            id="rate-jobTypeId"
            name="jobTypeId"
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Chọn loại công việc</option>
            {jobTypes.map((jt) => (
              <option key={jt.id} value={jt.id}>
                {jt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate-rateType">Loại mức lương *</Label>
          <select
            id="rate-rateType"
            name="rateType"
            defaultValue="PER_JOB"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {Object.entries(RateType).map(([key, value]) => (
              <option key={key} value={value}>
                {RATE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate-amount">Mức lương (VND) *</Label>
          <Input
            id="rate-amount"
            name="amount"
            type="number"
            min="0"
            step="1000"
            placeholder="500000"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate-effectiveFrom">Ngày hiệu lực *</Label>
          <Input
            id="rate-effectiveFrom"
            name="effectiveFrom"
            type="date"
            defaultValue={today}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate-note">Ghi chú</Label>
          <Input
            id="rate-note"
            name="note"
            placeholder="Ghi chú tùy chọn..."
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu mức lương"}
        </Button>
      </div>
    </form>
  )
}

export function WorkerRatesEditor({ workerId, rates, jobTypes }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDeactivate(rateId: string) {
    startTransition(async () => {
      const result = await deactivateWorkerRateAction(rateId, workerId)
      if (result.success) {
        toast.success("Đã hủy mức lương")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Mức lương</CardTitle>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm mức lương
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <AddRateForm
            workerId={workerId}
            jobTypes={jobTypes}
            onCancel={() => setShowForm(false)}
          />
        )}

        {rates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Chưa có mức lương nào được cấu hình.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại công việc</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Loại lương</TableHead>
                  <TableHead className="text-right">Mức lương</TableHead>
                  <TableHead>Hiệu lực từ</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${rate.jobType.color}20`,
                          color: rate.jobType.color,
                        }}
                      >
                        {rate.jobType.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {rate.serviceDefinition?.name ?? (
                        <span className="text-muted-foreground">Chung</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {RATE_TYPE_LABELS[rate.rateType as keyof typeof RATE_TYPE_LABELS]}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatAmount(rate.amount as unknown as number, rate.currency)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(rate.effectiveFrom).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {rate.note ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                        onClick={() => handleDeactivate(rate.id)}
                        title="Hủy kích hoạt"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

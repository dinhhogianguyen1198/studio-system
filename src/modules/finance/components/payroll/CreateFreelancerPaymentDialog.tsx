"use client"

import { useState, useEffect, useActionState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select } from "@/components/ui/select"
import {
  createFreelancerPaymentAction,
  getUnpaidAssignmentsAction,
} from "../../actions/freelancer-payment.actions"
import type { UnpaidAssignment } from "../../types/finance.types"

interface Worker {
  id: string
  name: string
  email: string | null
}

interface Props {
  workers: Worker[]
}

export function CreateFreelancerPaymentDialog({ workers }: Props) {
  const [open, setOpen] = useState(false)
  const [workerId, setWorkerId] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10))
  const [assignments, setAssignments] = useState<UnpaidAssignment[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingAssignments, setLoadingAssignments] = useState(false)

  const [state, formAction, isPending] = useActionState(createFreelancerPaymentAction, {
    success: false as const,
    error: "",
  })

  useEffect(() => {
    if (state.success) {
      toast.success("Đã tạo phiếu thanh toán")
      setOpen(false)
      setWorkerId("")
      setAssignments([])
      setSelectedIds(new Set())
    } else if (!state.success && state.error) {
      toast.error(state.error)
    }
  }, [state])

  async function loadAssignments(id: string) {
    if (!id) return
    setLoadingAssignments(true)
    try {
      const result = await getUnpaidAssignmentsAction(id)
      if (result.success) {
        setAssignments(result.data)
        setSelectedIds(new Set(result.data.map((a) => a.id)))
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoadingAssignments(false)
    }
  }

  const totalSelected = assignments
    .filter((a) => selectedIds.has(a.id))
    .reduce((sum, a) => sum + a.totalCost.toNumber(), 0)

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(assignments.map((a) => a.id)) : new Set())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Tạo phiếu thanh toán
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo phiếu thanh toán freelancer</DialogTitle>
          <DialogDescription>Chọn nhân viên và các công việc cần thanh toán</DialogDescription>
        </DialogHeader>

        <form
          action={(fd) => {
            fd.append("assignmentIds", JSON.stringify(Array.from(selectedIds)))
            formAction(fd)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="workerId">Nhân viên *</Label>
              <Select
                id="workerId"
                name="workerId"
                value={workerId}
                onChange={(e) => {
                  setWorkerId(e.target.value)
                  void loadAssignments(e.target.value)
                }}
                required
              >
                <option value="">Chọn nhân viên</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}{w.email ? ` · ${w.email}` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="periodStart">Từ ngày</Label>
                <Input
                  id="periodStart"
                  name="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="periodEnd">Đến ngày</Label>
                <Input
                  id="periodEnd"
                  name="periodEnd"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {workerId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Công việc chưa thanh toán</Label>
                {assignments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedIds.size === assignments.length}
                      onCheckedChange={toggleAll}
                    />
                    <label htmlFor="select-all" className="text-xs text-muted-foreground">
                      Chọn tất cả
                    </label>
                  </div>
                )}
              </div>

              {loadingAssignments ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Đang tải...</p>
              ) : assignments.length === 0 ? (
                <p className="rounded-lg border border-border py-6 text-center text-sm text-muted-foreground">
                  Không có công việc nào chưa được thanh toán
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {assignments.map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selectedIds.has(a.id)}
                        onCheckedChange={(checked) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev)
                            if (checked) next.add(a.id)
                            else next.delete(a.id)
                            return next
                          })
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {a.orderItem.name}
                          <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                            {a.orderItem.order.orderNumber}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.jobTypeNameSnapshot}
                          {a.completedAt &&
                            ` · Hoàn thành ${format(new Date(a.completedAt), "dd/MM/yyyy", { locale: vi })}`}
                        </p>
                      </div>
                      <span className="tabular-nums text-sm font-medium">
                        {a.totalCost.toNumber().toLocaleString("vi-VN")}đ
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    Đã chọn {selectedIds.size} công việc
                  </span>
                  <span className="font-bold tabular-nums">
                    {totalSelected.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending || selectedIds.size === 0}>
              {isPending ? "Đang tạo..." : "Tạo phiếu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

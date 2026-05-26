"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { MoreHorizontal, Ban, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FreelancerPaymentStatusBadge } from "../shared/StatusBadge"
import {
  processFreelancerPaymentAction,
  cancelFreelancerPaymentAction,
} from "../../actions/freelancer-payment.actions"
import type { FreelancerPaymentSummary } from "../../types/finance.types"

type SerializedPayment = Omit<FreelancerPaymentSummary, "totalAmount"> & { totalAmount: number }

function ProcessButton({ paymentId }: { paymentId: string }) {
  const [state, formAction, isPending] = useActionState(processFreelancerPaymentAction, {
    success: false as const,
    error: "",
  })
  useEffect(() => {
    if (state.success) toast.success("Đã thanh toán thành công")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={paymentId} />
      <input type="hidden" name="paymentMethod" value="BANK_TRANSFER" />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full">
          <CheckCircle className="mr-2 h-3.5 w-3.5 text-indicator-success" />
          Đánh dấu đã trả
        </button>
      </DropdownMenuItem>
    </form>
  )
}

function CancelButton({ paymentId }: { paymentId: string }) {
  const [state, formAction, isPending] = useActionState(cancelFreelancerPaymentAction, {
    success: false as const,
    error: "",
  })
  useEffect(() => {
    if (state.success) toast.success("Đã hủy phiếu thanh toán")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={paymentId} />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full text-destructive">
          <Ban className="mr-2 h-3.5 w-3.5" />
          Hủy phiếu
        </button>
      </DropdownMenuItem>
    </form>
  )
}

interface Props {
  payments: SerializedPayment[]
}

export function FreelancerPayrollTable({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">Chưa có phiếu thanh toán nào</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nhân viên
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Kỳ thanh toán
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Công việc
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tổng tiền
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Trạng thái
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ngày tạo
              </th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{payment.worker.name}</p>
                  {payment.worker.email && (
                    <p className="text-xs text-muted-foreground">{payment.worker.email}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {format(new Date(payment.periodStart), "dd/MM/yyyy", { locale: vi })} –{" "}
                  {format(new Date(payment.periodEnd), "dd/MM/yyyy", { locale: vi })}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {payment._count.items}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {payment.totalAmount.toLocaleString("vi-VN")}đ
                </td>
                <td className="px-4 py-3">
                  <FreelancerPaymentStatusBadge status={payment.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {format(new Date(payment.createdAt), "dd/MM/yyyy", { locale: vi })}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="xs" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {(payment.status === "PENDING" || payment.status === "PROCESSING") && (
                        <>
                          <ProcessButton paymentId={payment.id} />
                          <DropdownMenuSeparator />
                          <CancelButton paymentId={payment.id} />
                        </>
                      )}
                      {payment.status === "PAID" && (
                        <DropdownMenuItem disabled>
                          <CheckCircle className="mr-2 h-3.5 w-3.5 text-indicator-success" />
                          Đã thanh toán
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

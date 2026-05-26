"use client"

import { useActionState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { MoreHorizontal, Send, Ban, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InvoiceStatusBadge } from "../shared/StatusBadge"
import { sendInvoiceAction, cancelInvoiceAction } from "../../actions/invoice.actions"
import type { InvoiceSummary } from "../../types/finance.types"

type SerializedInvoice = Omit<InvoiceSummary, "totalAmount" | "paidAmount"> & {
  totalAmount: number
  paidAmount: number
}

function SendButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(sendInvoiceAction, { success: false as const, error: "" })
  useEffect(() => {
    if (state.success) toast.success("Đã gửi hóa đơn")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={invoiceId} />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full">
          <Send className="mr-2 h-3.5 w-3.5 text-indicator-info" />
          Đánh dấu đã gửi
        </button>
      </DropdownMenuItem>
    </form>
  )
}

function CancelButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(cancelInvoiceAction, { success: false as const, error: "" })
  useEffect(() => {
    if (state.success) toast.success("Đã hủy hóa đơn")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={invoiceId} />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full text-destructive">
          <Ban className="mr-2 h-3.5 w-3.5" />
          Hủy hóa đơn
        </button>
      </DropdownMenuItem>
    </form>
  )
}

interface Props {
  invoices: SerializedInvoice[]
}

export function InvoiceTable({ invoices }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">Chưa có hóa đơn nào</p>
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
                Số hóa đơn
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Khách hàng
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ngày phát hành
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hạn TT
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tổng tiền
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Còn lại
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Trạng thái
              </th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const remaining = invoice.totalAmount - invoice.paidAmount
              const isOverdue =
                invoice.status === "OVERDUE" ||
                (["SENT", "PARTIAL"].includes(invoice.status) &&
                  new Date(invoice.dueDate) < new Date())

              return (
                <tr
                  key={invoice.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/finance/invoices/${invoice.id}`}
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    {invoice.order && (
                      <p className="text-xs text-muted-foreground">{invoice.order.orderNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.customer?.name ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: vi })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={isOverdue ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {invoice.totalAmount.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={remaining > 0 ? "text-indicator-warning font-medium" : "text-muted-foreground"}>
                      {remaining > 0 ? `${remaining.toLocaleString("vi-VN")}đ` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="xs" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/finance/invoices/${invoice.id}`}>
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {invoice.status === "DRAFT" && <SendButton invoiceId={invoice.id} />}
                        {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                          <CancelButton invoiceId={invoice.id} />
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CheckCircle, XCircle, Ban, MoreHorizontal, Trash2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExpenseStatusBadge } from "../shared/StatusBadge"
import {
  approveExpenseAction,
  rejectExpenseAction,
  deleteExpenseAction,
  markExpensePaidAction,
} from "../../actions/expense.actions"
import type { ExpenseSummary } from "../../types/finance.types"

type SerializedExpense = Omit<ExpenseSummary, "amount"> & { amount: number }

interface RowActionsProps {
  expense: SerializedExpense
}

function ApproveButton({ expenseId }: { expenseId: string }) {
  const [state, formAction, isPending] = useActionState(approveExpenseAction, { success: false as const, error: "" })
  useEffect(() => {
    if (state.success) toast.success("Đã duyệt chi phí")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={expenseId} />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full">
          <CheckCircle className="mr-2 h-3.5 w-3.5 text-indicator-success" />
          Duyệt chi phí
        </button>
      </DropdownMenuItem>
    </form>
  )
}

function RejectButton({ expenseId }: { expenseId: string }) {
  const [state, formAction, isPending] = useActionState(rejectExpenseAction, { success: false as const, error: "" })
  useEffect(() => {
    if (state.success) toast.success("Đã từ chối chi phí")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={expenseId} />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full">
          <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
          Từ chối
        </button>
      </DropdownMenuItem>
    </form>
  )
}

function MarkPaidButton({ expenseId }: { expenseId: string }) {
  const [state, formAction, isPending] = useActionState(markExpensePaidAction, { success: false as const, error: "" })
  useEffect(() => {
    if (state.success) toast.success("Đã đánh dấu đã thanh toán")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={expenseId} />
      <input type="hidden" name="paymentMethod" value="BANK_TRANSFER" />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full">
          <CreditCard className="mr-2 h-3.5 w-3.5 text-indicator-info" />
          Đánh dấu đã trả
        </button>
      </DropdownMenuItem>
    </form>
  )
}

function DeleteButton({ expenseId }: { expenseId: string }) {
  const [state, formAction, isPending] = useActionState(deleteExpenseAction, { success: false as const, error: "" })
  useEffect(() => {
    if (state.success) toast.success("Đã xóa chi phí")
    else if (!state.success && state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={expenseId} />
      <DropdownMenuItem asChild>
        <button type="submit" disabled={isPending} className="w-full text-destructive">
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Xóa
        </button>
      </DropdownMenuItem>
    </form>
  )
}

function RowActions({ expense }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="xs" className="h-7 w-7 p-0">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {expense.status === "PENDING" && (
          <>
            <ApproveButton expenseId={expense.id} />
            <RejectButton expenseId={expense.id} />
            <DropdownMenuSeparator />
          </>
        )}
        {expense.status === "APPROVED" && (
          <>
            <MarkPaidButton expenseId={expense.id} />
            <DropdownMenuSeparator />
          </>
        )}
        {expense.status !== "PAID" && <DeleteButton expenseId={expense.id} />}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface Props {
  expenses: SerializedExpense[]
}

export function ExpenseTable({ expenses }: Props) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">Chưa có chi phí nào</p>
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
                Tiêu đề
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Danh mục
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ngày
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Số tiền
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Trạng thái
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Đơn hàng
              </th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{expense.title}</p>
                  {expense.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{expense.notes}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: expense.category.color ?? "#6B7280" }}
                    />
                    <span className="text-sm">{expense.category.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(expense.expenseDate), "dd/MM/yyyy", { locale: vi })}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {expense.amount.toLocaleString("vi-VN")}đ
                </td>
                <td className="px-4 py-3">
                  <ExpenseStatusBadge status={expense.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {expense.order ? (
                    <span className="font-mono text-xs">{expense.order.orderNumber}</span>
                  ) : (
                    <span className="text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RowActions expense={expense} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

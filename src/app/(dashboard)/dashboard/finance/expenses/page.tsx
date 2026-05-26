import { requirePermission } from "@/shared/lib/auth-utils"
import { expenseService } from "@/modules/finance/service/expense.service"
import { ExpenseTable } from "@/modules/finance/components/expenses/ExpenseTable"
import { CreateExpenseDialog } from "@/modules/finance/components/expenses/CreateExpenseDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ExpensesPage() {
  await requirePermission("finance_expenses", "read")

  const [{ data: expenses, meta }, categories] = await Promise.all([
    expenseService.list({ page: 1, pageSize: 50 }),
    expenseService.listCategories(),
  ])

  const pending = expenses.filter((e) => e.status === "PENDING").length
  const approved = expenses.filter((e) => e.status === "APPROVED").length
  const totalPaid = expenses
    .filter((e) => e.status === "PAID")
    .reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý chi phí</h1>
          <p className="text-sm text-muted-foreground">
            {meta.total} chi phí · {pending} chờ duyệt
          </p>
        </div>
        <CreateExpenseDialog categories={categories} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pending}</p>
            <p className="text-xs text-muted-foreground">chi phí chờ xử lý</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approved}</p>
            <p className="text-xs text-muted-foreground">chờ thanh toán</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {totalPaid.toLocaleString("vi-VN")}đ
            </p>
            <p className="text-xs text-muted-foreground">tổng chi phí kỳ này</p>
          </CardContent>
        </Card>
      </div>

      <ExpenseTable expenses={expenses.map((e) => ({ ...e, amount: e.amount.toNumber() }))} />
    </div>
  )
}

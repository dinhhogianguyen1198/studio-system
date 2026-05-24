import { requirePermission } from "@/shared/lib/auth-utils"
import { invoiceService } from "@/modules/finance/service/invoice.service"
import { InvoiceTable } from "@/modules/finance/components/invoices/InvoiceTable"
import { CreateInvoiceDialog } from "@/modules/finance/components/invoices/CreateInvoiceDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function InvoicesPage() {
  await requirePermission("finance_invoices", "read")

  const { data: invoices, meta } = await invoiceService.list({ page: 1, pageSize: 50 })

  const draft = invoices.filter((i) => i.status === "DRAFT").length
  const overdue = invoices.filter(
    (i) =>
      i.status === "OVERDUE" ||
      (["SENT", "PARTIAL"].includes(i.status) && new Date(i.dueDate) < new Date()),
  ).length
  const totalOutstanding = invoices
    .filter((i) => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status))
    .reduce((s, i) => s + i.totalAmount.toNumber() - i.paidAmount.toNumber(), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý hóa đơn</h1>
          <p className="text-sm text-muted-foreground">
            {meta.total} hóa đơn · {overdue > 0 ? `${overdue} quá hạn` : ""}
          </p>
        </div>
        <CreateInvoiceDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nháp</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{draft}</p>
            <p className="text-xs text-muted-foreground">chưa gửi cho khách</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quá hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${overdue > 0 ? "text-destructive" : ""}`}>
              {overdue}
            </p>
            <p className="text-xs text-muted-foreground">hóa đơn chưa thanh toán</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Công nợ phải thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {totalOutstanding.toLocaleString("vi-VN")}đ
            </p>
            <p className="text-xs text-muted-foreground">tổng chưa thu được</p>
          </CardContent>
        </Card>
      </div>

      <InvoiceTable invoices={invoices} />
    </div>
  )
}

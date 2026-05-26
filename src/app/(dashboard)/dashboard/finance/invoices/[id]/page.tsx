import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { invoiceService } from "@/modules/finance/service/invoice.service"
import { InvoiceStatusBadge } from "@/modules/finance/components/shared/StatusBadge"
import { SendInvoiceButton } from "@/modules/finance/components/invoices/SendInvoiceButton"
import { CancelInvoiceButton } from "@/modules/finance/components/invoices/CancelInvoiceButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  await requirePermission("finance_invoices", "read")
  const { id } = await params

  const invoice = await invoiceService.getById(id)
  if (!invoice) notFound()

  const remaining = invoice.totalAmount.toNumber() - invoice.paidAmount.toNumber()
  const isOverdue =
    invoice.status === "OVERDUE" ||
    (["SENT", "PARTIAL"].includes(invoice.status) && new Date(invoice.dueDate) < new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/finance/invoices"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Danh sách hóa đơn
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {invoice.invoiceNumber}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
            {isOverdue && invoice.status !== "OVERDUE" && (
              <span className="text-xs font-medium text-destructive">Quá hạn</span>
            )}
          </div>
          {invoice.order && (
            <p className="text-sm text-muted-foreground">
              Đơn hàng:{" "}
              <Link
                href={`/dashboard/orders/${invoice.order.id}`}
                className="hover:underline"
              >
                {invoice.order.orderNumber}
              </Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "DRAFT" && <SendInvoiceButton invoiceId={invoice.id} />}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <CancelInvoiceButton invoiceId={invoice.id} />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Chi tiết hóa đơn</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-4 gap-0">
              <div className="border-b border-r border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted/20">
                Mô tả
              </div>
              <div className="border-b border-r border-border px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted/20">
                Số lượng
              </div>
              <div className="border-b border-r border-border px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted/20">
                Đơn giá
              </div>
              <div className="border-b border-border px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted/20">
                Thành tiền
              </div>
            </div>

            {invoice.items.map((item) => (
              <div key={item.id} className="grid grid-cols-4 border-b border-border last:border-0">
                <div className="border-r border-border px-4 py-3 text-sm">{item.description}</div>
                <div className="border-r border-border px-4 py-3 text-center text-sm">
                  {item.quantity.toNumber().toLocaleString("vi-VN")}
                </div>
                <div className="border-r border-border px-4 py-3 text-right text-sm tabular-nums">
                  {item.unitPrice.toNumber().toLocaleString("vi-VN")}đ
                </div>
                <div className="px-4 py-3 text-right text-sm font-medium tabular-nums">
                  {item.totalPrice.toNumber().toLocaleString("vi-VN")}đ
                </div>
              </div>
            ))}

            <div className="border-t border-border bg-muted/20 px-4 py-3">
              <div className="ml-auto w-64 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="tabular-nums">{invoice.subtotal.toNumber().toLocaleString("vi-VN")}đ</span>
                </div>
                {invoice.discountAmount.toNumber() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giảm giá</span>
                    <span className="tabular-nums text-indicator-success">
                      -{invoice.discountAmount.toNumber().toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                {invoice.taxAmount.toNumber() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Thuế</span>
                    <span className="tabular-nums">
                      +{invoice.taxAmount.toNumber().toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Tổng cộng</span>
                  <span className="tabular-nums">{invoice.totalAmount.toNumber().toLocaleString("vi-VN")}đ</span>
                </div>
                {invoice.paidAmount.toNumber() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Đã thanh toán</span>
                    <span className="tabular-nums text-indicator-success">
                      -{invoice.paidAmount.toNumber().toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                {remaining > 0 && (
                  <div className="flex justify-between font-medium text-indicator-warning">
                    <span>Còn phải thu</span>
                    <span className="tabular-nums">{remaining.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày phát hành</span>
                <span>{format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: vi })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hạn thanh toán</span>
                <span className={isOverdue ? "font-medium text-destructive" : ""}>
                  {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
                </span>
              </div>
              {invoice.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khách hàng</span>
                  <span className="text-right">{invoice.customer.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạo bởi</span>
                <span>{invoice.createdBy.name}</span>
              </div>
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đã gửi</span>
                  <span>{format(new Date(invoice.sentAt), "dd/MM/yyyy", { locale: vi })}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

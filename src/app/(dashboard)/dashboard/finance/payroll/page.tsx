import { requirePermission } from "@/shared/lib/auth-utils"
import { freelancerPaymentService } from "@/modules/finance/service/freelancer-payment.service"
import { FreelancerPayrollTable } from "@/modules/finance/components/payroll/FreelancerPayrollTable"
import { CreateFreelancerPaymentDialog } from "@/modules/finance/components/payroll/CreateFreelancerPaymentDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/shared/lib/prisma"

export default async function PayrollPage() {
  await requirePermission("finance_payroll", "read")

  const [{ data: payments, meta }, unpaidCount, workers] = await Promise.all([
    freelancerPaymentService.list({ page: 1, pageSize: 50 }),
    freelancerPaymentService.countUnpaidWorkers(),
    db.worker.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])

  const totalPending = payments
    .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((s, p) => s + p.totalAmount.toNumber(), 0)

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.totalAmount.toNumber(), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Thanh toán freelancer</h1>
          <p className="text-sm text-muted-foreground">
            {meta.total} phiếu · {unpaidCount} nhân viên chờ thanh toán
          </p>
        </div>
        <CreateFreelancerPaymentDialog workers={workers} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chưa thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${unpaidCount > 0 ? "text-orange-600" : ""}`}>
              {unpaidCount} người
            </p>
            <p className="text-xs text-muted-foreground">có công việc hoàn thành chờ trả</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang chờ xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {totalPending.toLocaleString("vi-VN")}đ
            </p>
            <p className="text-xs text-muted-foreground">phiếu chưa được trả</p>
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
            <p className="text-xs text-muted-foreground">tổng đã chi trả</p>
          </CardContent>
        </Card>
      </div>

      <FreelancerPayrollTable payments={payments} />
    </div>
  )
}

import { Suspense } from "react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { workerAssignmentService } from "@/modules/workforce/service/worker-assignment.service"
import { PayrollSummaryDashboard } from "@/modules/workforce/components/payroll/PayrollSummaryDashboard"
import {
  serializeOrderItemWorker,
  type WorkerPayrollSummary,
} from "@/modules/workforce/types/workforce.types"

async function PayrollContent() {
  const allAssignments = await workerAssignmentService.getAssignments({})

  const unpaidAssignments = allAssignments.filter((a) => a.paidAt === null)

  // Tổng hợp theo nhân viên — chỉ lấy những nhân viên có phân công chưa thanh toán
  const workerMap = new Map<string, WorkerPayrollSummary>()
  for (const a of unpaidAssignments) {
    const existing = workerMap.get(a.workerId)
    if (existing) {
      existing.unpaidCount++
      existing.unpaidAmount += Number(a.totalCost)
      existing.assignmentIds.push(a.id)
      existing.assignments.push(serializeOrderItemWorker(a))
    } else {
      workerMap.set(a.workerId, {
        workerId: a.workerId,
        workerName: a.workerNameSnapshot,
        workerAvatarUrl: a.worker.avatarUrl,
        unpaidCount: 1,
        unpaidAmount: Number(a.totalCost),
        assignmentIds: [a.id],
        assignments: [serializeOrderItemWorker(a)],
      })
    }
  }
  const workerSummaries = Array.from(workerMap.values()).sort(
    (a, b) => b.unpaidAmount - a.unpaidAmount,
  )

  const assignments = allAssignments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100)
    .map(serializeOrderItemWorker)

  return (
    <PayrollSummaryDashboard
      data={{
        workerSummaries,
        assignments,
      }}
    />
  )
}

export default async function PayrollPage() {
  await requirePermission("workforce_payroll", "read")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bảng lương</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan chi phí nhân sự và phân công
        </p>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
        <PayrollContent />
      </Suspense>
    </div>
  )
}

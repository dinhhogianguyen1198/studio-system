import { Suspense } from "react"
import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { workerService } from "@/modules/workforce/service/worker.service"
import { workerAssignmentService } from "@/modules/workforce/service/worker-assignment.service"
import { PayrollSummaryDashboard } from "@/modules/workforce/components/payroll/PayrollSummaryDashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

async function PayrollContent() {
  const [workersResult, allAssignments] = await Promise.all([
    workerService.getWorkers({ page: 1, pageSize: 1 }),
    workerAssignmentService.getAssignments({}),
  ])

  const activeWorkersResult = await workerService.getWorkers({
    page: 1,
    pageSize: 1,
    isActive: true,
  })

  const totalWorkers = workersResult.meta.total
  const activeWorkers = activeWorkersResult.meta.total
  const totalAssignments = allAssignments.length
  const completedAssignments = allAssignments.filter(
    (a) => a.status === "COMPLETED",
  ).length

  const totalCost = allAssignments
    .filter((a) => a.status !== "CANCELLED")
    .reduce((sum, a) => sum + Number(a.totalCost), 0)

  // Sort by most recent and take latest 20
  const recentAssignments = [...allAssignments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 20)

  return (
    <PayrollSummaryDashboard
      data={{
        totalWorkers,
        activeWorkers,
        totalAssignments,
        completedAssignments,
        totalCost,
        currency: "VND",
        recentAssignments,
      }}
    />
  )
}

export default async function PayrollPage() {
  await requirePermission("workforce_payroll", "read")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/workforce">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Bảng lương</h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan chi phí ekip và phân công
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        }
      >
        <PayrollContent />
      </Suspense>
    </div>
  )
}

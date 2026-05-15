import { Suspense } from "react"
import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { workerService } from "@/modules/workforce/service/worker.service"
import { jobTypeService } from "@/modules/workforce/service/job-type.service"
import { workerAssignmentService } from "@/modules/workforce/service/worker-assignment.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Briefcase,
  ClipboardList,
  DollarSign,
  ArrowRight,
} from "lucide-react"

async function WorkforceStats() {
  const [workersResult, activeWorkersResult, jobTypesResult, allAssignments] =
    await Promise.all([
      workerService.getWorkers({ page: 1, pageSize: 1 }),
      workerService.getWorkers({ page: 1, pageSize: 1, isActive: true }),
      jobTypeService.getJobTypes({ page: 1, pageSize: 1, isActive: true }),
      workerAssignmentService.getAssignments({}),
    ])

  const totalWorkers = workersResult.meta.total
  const activeWorkers = activeWorkersResult.meta.total
  const activeJobTypes = jobTypesResult.meta.total
  const totalAssignments = allAssignments.length

  const cards = [
    {
      title: "Nhân viên",
      icon: Users,
      value: activeWorkers,
      description: `${totalWorkers} tổng số`,
      href: "/dashboard/workforce/workers",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Loại công việc",
      icon: Briefcase,
      value: activeJobTypes,
      description: "Đang hoạt động",
      href: "/dashboard/workforce/job-types",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Phân công",
      icon: ClipboardList,
      value: totalAssignments,
      description: "Tổng phân công",
      href: "/dashboard/workforce/payroll",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Bảng lương",
      icon: DollarSign,
      value: null,
      description: "Xem chi phí ekip",
      href: "/dashboard/workforce/payroll",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}>
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {card.value !== null ? (
                <p className="text-3xl font-bold">{card.value}</p>
              ) : (
                <p className="text-lg font-semibold text-muted-foreground">—</p>
              )}
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {card.description}
                <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default async function WorkforceOverviewPage() {
  await requirePermission("workforce_workers", "read")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ekip phụ trách</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý nhân viên, vai trò và phân công
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/workforce/job-types">Loại công việc</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/workforce/workers/new">Thêm nhân viên</Link>
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        }
      >
        <WorkforceStats />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Nhân viên</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/workforce/workers">
                  Xem tất cả <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              Quản lý danh sách nhân viên, kỹ năng và mức lương.
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link href="/dashboard/workforce/workers/new">Thêm nhân viên</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/workforce/workers">Xem danh sách</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Bảng lương & Phân công</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/workforce/payroll">
                  Xem chi tiết <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              Theo dõi tổng chi phí nhân sự, trạng thái phân công và báo cáo lương.
            </p>
            <div className="mt-4">
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/workforce/payroll">Xem bảng lương</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

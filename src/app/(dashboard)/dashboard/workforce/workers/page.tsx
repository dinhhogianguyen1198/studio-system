import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { workerService } from "@/modules/workforce/service/worker.service"
import { WorkerFilters } from "@/modules/workforce/components/workers/WorkerFilters"
import { WorkerTable } from "@/modules/workforce/components/workers/WorkerTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus } from "lucide-react"

interface Props {
  searchParams: Promise<{ search?: string; isActive?: string; page?: string }>
}

export default async function WorkersPage({ searchParams }: Props) {
  await requirePermission("workforce_workers", "read")
  const params = await searchParams

  const result = await workerService.getWorkers({
    page: Number(params.page ?? 1),
    pageSize: 20,
    search: params.search,
    isActive:
      params.isActive === "true"
        ? true
        : params.isActive === "false"
          ? false
          : undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nhân viên</h1>
          <p className="text-sm text-muted-foreground">
            {result.meta.total} nhân viên
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/workforce/workers/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhân viên
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <WorkerFilters />
        </CardHeader>
        <CardContent className="p-0">
          <WorkerTable workers={result.data} />
        </CardContent>
      </Card>
    </div>
  )
}

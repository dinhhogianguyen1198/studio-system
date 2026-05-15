import { Suspense } from "react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { jobTypeService } from "@/modules/workforce/service/job-type.service"
import { JobTypeTable } from "@/modules/workforce/components/job-types/JobTypeTable"
import { JobTypeCreateDialog } from "@/modules/workforce/components/job-types/JobTypeCreateDialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Props {
  searchParams: Promise<{ search?: string; isActive?: string; page?: string }>
}

export default async function JobTypesPage({ searchParams }: Props) {
  await requirePermission("workforce_job_types", "read")
  const params = await searchParams

  const result = await jobTypeService.getJobTypes({
    page: Number(params.page ?? 1),
    pageSize: 50,
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
          <h1 className="text-2xl font-bold">Loại công việc</h1>
          <p className="text-sm text-muted-foreground">
            {result.meta.total} loại công việc
          </p>
        </div>
        <JobTypeCreateDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm loại công việc
          </Button>
        </JobTypeCreateDialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Suspense
            fallback={
              <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>
            }
          >
            <JobTypeTable jobTypes={result.data} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

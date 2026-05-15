import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { jobTypeService } from "@/modules/workforce/service/job-type.service"
import { createWorkerAction } from "@/modules/workforce/actions/worker.actions"
import { WorkerForm } from "@/modules/workforce/components/workers/WorkerForm"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NewWorkerPage() {
  await requirePermission("workforce_workers", "create")

  const jobTypes = await jobTypeService.getAllActiveJobTypes()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/workforce/workers">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Thêm nhân viên</h1>
          <p className="text-sm text-muted-foreground">
            Tạo hồ sơ nhân viên mới
          </p>
        </div>
      </div>

      <WorkerForm action={createWorkerAction} jobTypes={jobTypes} />
    </div>
  )
}

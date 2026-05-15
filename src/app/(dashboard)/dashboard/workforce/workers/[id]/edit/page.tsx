import { notFound } from "next/navigation"
import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { workerService } from "@/modules/workforce/service/worker.service"
import { jobTypeService } from "@/modules/workforce/service/job-type.service"
import { updateWorkerAction } from "@/modules/workforce/actions/worker.actions"
import { WorkerForm } from "@/modules/workforce/components/workers/WorkerForm"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditWorkerPage({ params }: Props) {
  await requirePermission("workforce_workers", "update")
  const { id } = await params

  let worker: Awaited<ReturnType<typeof workerService.getWorkerById>>
  try {
    worker = await workerService.getWorkerById(id)
  } catch {
    notFound()
  }

  const jobTypes = await jobTypeService.getAllActiveJobTypes()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/workforce/workers/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chỉnh sửa nhân viên</h1>
          <p className="text-sm text-muted-foreground">{worker.name}</p>
        </div>
      </div>

      <WorkerForm
        action={updateWorkerAction}
        jobTypes={jobTypes}
        defaultValues={worker}
        redirectTo={`/dashboard/workforce/workers/${id}`}
      />
    </div>
  )
}

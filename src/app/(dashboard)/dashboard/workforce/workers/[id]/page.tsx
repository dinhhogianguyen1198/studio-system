import { notFound } from "next/navigation"
import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { workerService } from "@/modules/workforce/service/worker.service"
import { jobTypeService } from "@/modules/workforce/service/job-type.service"
import { serializeWorkerDetail } from "@/modules/workforce/types/workforce.types"
import { WorkerStatusBadge } from "@/modules/workforce/components/workers/WorkerStatusBadge"
import { WorkerRatesEditor } from "@/modules/workforce/components/workers/WorkerRatesEditor"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Pencil, Phone } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function WorkerDetailPage({ params }: Props) {
  await requirePermission("workforce_workers", "read")
  const { id } = await params

  let worker: Awaited<ReturnType<typeof workerService.getWorkerById>>
  try {
    worker = await workerService.getWorkerById(id)
  } catch {
    notFound()
  }

  const jobTypes = await jobTypeService.getAllActiveJobTypes()
  const serializedWorker = serializeWorkerDetail(worker)

  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/workforce/workers">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={worker.avatarUrl ?? undefined} alt={worker.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{worker.name}</h1>
                <WorkerStatusBadge isActive={worker.isActive} />
              </div>
              <p className="text-sm text-muted-foreground">
                Tham gia{" "}
                {new Date(worker.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/workforce/workers/${id}/edit`}>
            <Pencil className="size-4 mr-2" />
            Chỉnh sửa
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: contact + job types */}
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              {worker.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${worker.email}`} className="hover:underline">
                    {worker.email}
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground">Chưa có email</p>
              )}
              {worker.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <a href={`tel:${worker.phone}`} className="hover:underline">
                    {worker.phone}
                  </a>
                </div>
              )}
              {worker.notes && (
                <>
                  <Separator />
                  <p className="text-muted-foreground text-xs">{worker.notes}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">
                Kỹ năng / Vai trò ({worker.jobTypes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {worker.jobTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có vai trò nào</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {worker.jobTypes.map((wjt) => (
                    <span
                      key={wjt.jobType.id}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${wjt.jobType.color}20`,
                        color: wjt.jobType.color,
                      }}
                    >
                      {wjt.isPrimary && (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                      {wjt.jobType.name}
                      {wjt.isPrimary && (
                        <span className="ml-1 text-[10px] opacity-70">(Chính)</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: rates editor */}
        <div className="lg:col-span-2">
          <WorkerRatesEditor
            workerId={worker.id}
            rates={serializedWorker.rates}
            jobTypes={jobTypes}
          />
        </div>
      </div>
    </div>
  )
}

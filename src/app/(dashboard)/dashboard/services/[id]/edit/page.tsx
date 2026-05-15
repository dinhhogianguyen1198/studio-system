import { notFound } from "next/navigation"
import { requirePermission } from "@/shared/lib/auth-utils"
import { serviceDefinitionService } from "@/modules/services/service/service-definition.service"
import { serializeServiceDefinitionDetail } from "@/modules/services/types/services.types"
import { workflowTemplateService } from "@/modules/workflow/service/workflow-template.service"
import { ServiceDefinitionForm } from "@/modules/services/components/definitions/ServiceDefinitionForm"
import { updateServiceDefinitionAction } from "@/modules/services/actions/service-definition.actions"
import type { ActionResult } from "@/shared/types/api.types"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditServiceDefinitionPage({ params }: Props) {
  await requirePermission("service_catalog", "update")
  const { id } = await params

  const [rawService, workflowTemplates] = await Promise.all([
    serviceDefinitionService.findById(id).catch(() => null),
    workflowTemplateService.findMany(),
  ])
  if (!rawService) notFound()
  const service = serializeServiceDefinitionDetail(rawService)

  const boundAction = updateServiceDefinitionAction.bind(null, id)

  async function action(
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    "use server"
    const result = await boundAction({ success: false, error: "" }, formData)
    if (result.success) return { success: true, data: { id } }
    return result
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa dịch vụ</h1>
        <p className="text-muted-foreground text-sm">{service.name}</p>
      </div>
      <ServiceDefinitionForm
        action={action}
        defaultValues={service}
        workflowTemplates={workflowTemplates}
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}

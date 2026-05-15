import { requirePermission } from "@/shared/lib/auth-utils"
import { workflowTemplateService } from "@/modules/workflow/service/workflow-template.service"
import { ServiceDefinitionForm } from "@/modules/services/components/definitions/ServiceDefinitionForm"
import { createServiceDefinitionAction } from "@/modules/services/actions/service-definition.actions"

export default async function NewServiceDefinitionPage() {
  await requirePermission("service_catalog", "create")
  const workflowTemplates = await workflowTemplateService.findMany()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thêm dịch vụ</h1>
        <p className="text-muted-foreground text-sm">Tạo dịch vụ mới cho studio</p>
      </div>
      <ServiceDefinitionForm
        action={createServiceDefinitionAction}
        workflowTemplates={workflowTemplates}
      />
    </div>
  )
}

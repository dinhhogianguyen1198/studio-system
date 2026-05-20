import { requirePermission } from "@/shared/lib/auth-utils"
import { serviceDefinitionService } from "@/modules/services/service/service-definition.service"
import { serializeServiceDefinitionSummary } from "@/modules/services/types/services.types"
import { ServiceDefinitionTable } from "@/modules/services/components/definitions/ServiceDefinitionTable"
import { CreateServiceDefinitionDialog } from "@/modules/services/components/definitions/CreateServiceDefinitionDialog"
import { workflowTemplateService } from "@/modules/workflow/service/workflow-template.service"

export default async function ServicesPage() {
  await requirePermission("service_catalog", "read")
  const [{ data: raw }, workflowTemplates] = await Promise.all([
    serviceDefinitionService.findMany({ page: 1, pageSize: 100 }),
    workflowTemplateService.findMany(),
  ])
  const services = raw.map(serializeServiceDefinitionSummary)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dịch vụ</h1>
          <p className="text-muted-foreground text-sm">Quản lý danh sách dịch vụ của studio</p>
        </div>
        <CreateServiceDefinitionDialog workflowTemplates={workflowTemplates} />
      </div>

      <ServiceDefinitionTable services={services} />
    </div>
  )
}

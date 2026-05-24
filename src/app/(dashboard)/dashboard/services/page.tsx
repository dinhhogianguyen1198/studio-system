import { requirePermission } from "@/shared/lib/auth-utils"
import { serviceDefinitionService } from "@/modules/services/service/service-definition.service"
import { serializeServiceDefinitionSummary } from "@/modules/services/types/services.types"
import { ServiceDefinitionTable } from "@/modules/services/components/definitions/ServiceDefinitionTable"
import { CreateServiceDefinitionDialog } from "@/modules/services/components/definitions/CreateServiceDefinitionDialog"

export default async function ServicesPage() {
  await requirePermission("service_catalog", "read")
  const { data: raw } = await serviceDefinitionService.findMany({ page: 1, pageSize: 100 })
  const services = raw.map(serializeServiceDefinitionSummary)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dịch vụ</h1>
          <p className="text-muted-foreground text-sm">Quản lý danh sách dịch vụ của studio</p>
        </div>
        <CreateServiceDefinitionDialog />
      </div>

      <ServiceDefinitionTable services={services} />
    </div>
  )
}

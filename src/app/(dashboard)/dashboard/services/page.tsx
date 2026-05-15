import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { serviceDefinitionService } from "@/modules/services/service/service-definition.service"
import { serializeServiceDefinitionSummary } from "@/modules/services/types/services.types"
import { ServiceDefinitionTable } from "@/modules/services/components/definitions/ServiceDefinitionTable"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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
        <Button asChild>
          <Link href="/dashboard/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm dịch vụ
          </Link>
        </Button>
      </div>

      <ServiceDefinitionTable services={services} />
    </div>
  )
}

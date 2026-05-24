import Link from "next/link"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { db } from "@/shared/lib/prisma"
import { serviceDefinitionService } from "@/modules/services/service/service-definition.service"
import { orderManagementUnitService } from "@/modules/orders/service/order-management-unit.service"
import { NewOrderForm } from "@/modules/orders/components/orders/NewOrderForm"
import { serializeServiceDefinitionSummary } from "@/modules/services/types/services.types"

export default async function NewOrderPage() {
  await requirePermission("orders", "create")

  const [customers, rawServices, managementUnits] = await Promise.all([
    db.customer.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, phone: true, email: true, address: true },
      orderBy: { name: "asc" },
    }),
    serviceDefinitionService.findAllActive(),
    orderManagementUnitService.findAllActive(),
  ])

  const services = rawServices.map(serializeServiceDefinitionSummary)

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Đơn hàng
      </Link>

      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Tạo đơn hàng mới
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập thông tin khách hàng, thêm dịch vụ và xác nhận đơn hàng
          </p>
        </div>
      </div>

      <NewOrderForm customers={customers} services={services} managementUnits={managementUnits} />
    </div>
  )
}

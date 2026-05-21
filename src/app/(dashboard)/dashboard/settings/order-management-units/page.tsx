import { requirePermission } from "@/shared/lib/auth-utils"
import { orderManagementUnitService } from "@/modules/orders/service/order-management-unit.service"
import { OrderManagementUnitTable } from "@/modules/orders/components/management-units/OrderManagementUnitTable"
import { CreateOrderManagementUnitDialog } from "@/modules/orders/components/management-units/CreateOrderManagementUnitDialog"

export default async function OrderManagementUnitsPage() {
  await requirePermission("order_management_units", "read")

  const { data: units } = await orderManagementUnitService.findMany({
    page: 1,
    pageSize: 100,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đơn vị quản lý đơn hàng</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý danh sách đơn vị dùng để phân loại đơn hàng
          </p>
        </div>
        <CreateOrderManagementUnitDialog />
      </div>

      <OrderManagementUnitTable units={units} />
    </div>
  )
}

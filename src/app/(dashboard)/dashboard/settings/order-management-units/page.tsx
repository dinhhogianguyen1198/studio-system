import { requirePermission } from "@/shared/lib/auth-utils"
import { orderManagementUnitService } from "@/modules/orders/service/order-management-unit.service"
import { OrderManagementUnitTable } from "@/modules/orders/components/management-units/OrderManagementUnitTable"
import { CreateOrderManagementUnitDialog } from "@/modules/orders/components/management-units/CreateOrderManagementUnitDialog"
import { Boxes } from "lucide-react"

export default async function OrderManagementUnitsPage() {
  await requirePermission("order_management_units", "read")

  const { data: units } = await orderManagementUnitService.findMany({
    page: 1,
    pageSize: 100,
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="size-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold">Đơn vị quản lý đơn hàng</h2>
            <p className="text-xs text-muted-foreground">
              Quản lý danh sách đơn vị dùng để phân loại đơn hàng
            </p>
          </div>
        </div>
        <CreateOrderManagementUnitDialog />
      </div>

      <OrderManagementUnitTable units={units} />
    </div>
  )
}

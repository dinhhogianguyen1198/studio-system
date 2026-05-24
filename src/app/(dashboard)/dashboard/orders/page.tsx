import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { orderService } from "@/modules/orders/service/order.service"
import { orderManagementUnitService } from "@/modules/orders/service/order-management-unit.service"
import { serializeOrderSummary } from "@/modules/orders/types/orders.types"
import { OrderTable } from "@/modules/orders/components/orders/OrderTable"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

const VALID_PAGE_SIZES = [10, 20, 50]

interface Props {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    status?: string
    search?: string
    managementUnitId?: string
  }>
}

export default async function OrdersPage({ searchParams }: Props) {
  await requirePermission("orders", "read")
  const { page, pageSize, status, search, managementUnitId } = await searchParams

  void orderService.autoUpdateOrderStatuses()

  const currentPage = Math.max(1, Number(page ?? 1))
  const currentPageSize = VALID_PAGE_SIZES.includes(Number(pageSize)) ? Number(pageSize) : 20

  const [{ data, total }, managementUnits] = await Promise.all([
    orderService.findMany({
      page: currentPage,
      pageSize: currentPageSize,
      status: status || undefined,
      search: search || undefined,
      orderManagementUnitId: managementUnitId || undefined,
    }),
    orderManagementUnitService.findAllActive(),
  ])

  const meta = {
    page: currentPage,
    pageSize: currentPageSize,
    total,
    totalPages: Math.ceil(total / currentPageSize),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng</h1>
          <p className="text-muted-foreground text-sm">Quản lý toàn bộ đơn hàng của studio</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn hàng
          </Link>
        </Button>
      </div>

      <OrderTable
        orders={data.map(serializeOrderSummary)}
        meta={meta}
        managementUnits={managementUnits.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  )
}

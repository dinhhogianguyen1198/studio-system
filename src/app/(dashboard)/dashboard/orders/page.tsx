import Link from "next/link"
import { requirePermission } from "@/shared/lib/auth-utils"
import { orderService } from "@/modules/orders/service/order.service"
import { serializeOrderSummary } from "@/modules/orders/types/orders.types"
import { OrderTable } from "@/modules/orders/components/orders/OrderTable"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Props {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>
}

export default async function OrdersPage({ searchParams }: Props) {
  await requirePermission("orders", "read")
  const { page, status, search } = await searchParams

  const currentPage = Number(page ?? 1)
  const { data, total } = await orderService.findMany({
    page: currentPage,
    pageSize: 20,
    status: status || undefined,
    search: search || undefined,
  })

  const meta = {
    page: currentPage,
    pageSize: 20,
    total,
    totalPages: Math.ceil(total / 20),
  }

  return (
    <div className="space-y-6">
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

      <OrderTable orders={data.map(serializeOrderSummary)} meta={meta} />
    </div>
  )
}

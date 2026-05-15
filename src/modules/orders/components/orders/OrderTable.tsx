"use client"

import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { SerializedOrderSummary } from "../../types/orders.types"
import type { PaginationMeta } from "@/shared/types/api.types"
import { OrderStatusBadge } from "./OrderStatusBadge"

interface Props {
  orders: SerializedOrderSummary[]
  meta: PaginationMeta
}

export function OrderTable({ orders, meta }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigatePage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (orders.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border py-12 text-center text-sm">
        Chưa có đơn hàng nào.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Số đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead className="text-center">Dịch vụ</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Đã thanh toán</TableHead>
            <TableHead className="text-center">Trạng thái</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const debt = Number(order.totalAmount) - Number(order.paidAmount)
            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {order.customer?.name ?? order.contactName}
                    </p>
                    {order.contactPhone && (
                      <p className="text-muted-foreground text-xs">{order.contactPhone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{order._count.items}</TableCell>
                <TableCell>
                  {Number(order.totalAmount).toLocaleString("vi-VN")}
                </TableCell>
                <TableCell>
                  <div>
                    <p>{Number(order.paidAmount).toLocaleString("vi-VN")}</p>
                    {debt > 0 && (
                      <p className="text-destructive text-xs">
                        Còn lại: {debt.toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: vi })}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {(meta.page - 1) * meta.pageSize + 1}–
            {Math.min(meta.page * meta.pageSize, meta.total)} / {meta.total} đơn hàng
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={meta.page <= 1}
              onClick={() => navigatePage(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={meta.page >= meta.totalPages}
              onClick={() => navigatePage(meta.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

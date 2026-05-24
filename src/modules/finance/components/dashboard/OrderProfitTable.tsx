"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { OrderProfitReport } from "../../types/finance.types"

interface Props {
  data: OrderProfitReport[]
}

function MarginBadge({ margin }: { margin: number }) {
  if (margin < 0) return <Badge variant="destructive">{margin.toFixed(1)}%</Badge>
  if (margin < 15) return <Badge variant="warning">{margin.toFixed(1)}%</Badge>
  if (margin < 30) return <Badge variant="muted">{margin.toFixed(1)}%</Badge>
  return <Badge variant="success">{margin.toFixed(1)}%</Badge>
}

export function OrderProfitTable({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top đơn hàng theo lợi nhuận</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Đơn hàng
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Doanh thu
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Chi phí
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lợi nhuận
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Biên
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.orderId} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${row.orderId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {row.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{row.customerName}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.revenue.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {(row.workerCosts + row.directExpenses).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={row.grossProfit < 0 ? "text-destructive" : ""}>
                        {row.grossProfit.toLocaleString("vi-VN")}đ
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MarginBadge margin={row.grossMargin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

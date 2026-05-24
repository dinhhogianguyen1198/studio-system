import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TopServiceProfit } from "../../types/finance.types"

interface Props {
  data: TopServiceProfit[]
}

export function TopServicesTable({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top dịch vụ theo doanh thu</CardTitle>
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
                    Dịch vụ
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Số lượng
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Doanh thu
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    TB/đơn
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((service) => (
                  <tr
                    key={service.serviceId}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium">{service.serviceName}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {service.count}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {service.revenue.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                      {service.averageRevenue.toLocaleString("vi-VN")}đ
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

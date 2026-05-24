import { Receipt, CheckCircle2 } from "lucide-react"
import { WidgetShell } from "../shared/WidgetShell"
import { EmptyState } from "../shared/EmptyState"
import type { UnpaidByUnit } from "../../types/dashboard.types"

interface UnpaidOrdersWidgetProps {
  data: UnpaidByUnit[]
}

function formatVnd(value: number): string {
  return value.toLocaleString("vi-VN") + " ₫"
}

export function UnpaidOrdersWidget({
  data,
}: UnpaidOrdersWidgetProps): React.ReactElement {
  const totalCount = data.reduce((sum, u) => sum + u.count, 0)
  const totalAmount = data.reduce((sum, u) => sum + u.totalUnpaid, 0)
  const maxUnpaid = Math.max(...data.map((u) => u.totalUnpaid), 1)

  return (
    <WidgetShell
      title="Chưa thanh toán"
      subtitle={totalCount > 0 ? `${totalCount} đơn hàng` : undefined}
      icon={Receipt}
      action={
        totalCount > 0
          ? { label: "Xem chi tiết", href: "/dashboard/orders" }
          : undefined
      }
    >
      {data.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Tất cả đơn đã thanh toán"
          description="Không có đơn hàng nào còn nợ"
        />
      ) : (
        <div>
          {/* Unit List */}
          <div className="space-y-0">
            {data.map((unit, index) => (
              <div
                key={unit.unitId ?? "unclassified"}
                className={
                  index < data.length - 1
                    ? "py-3 border-b border-border/50"
                    : "py-3"
                }
              >
                <p className="text-sm font-medium truncate">{unit.unitName}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {unit.count} đơn
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-warning-foreground">
                    {formatVnd(unit.totalUnpaid)}
                  </span>
                </div>
                {/* Mini bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-chart-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${(unit.totalUnpaid / maxUnpaid) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          {data.length > 1 && (
            <div className="border-t-2 border-border pt-3 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tổng cộng</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatVnd(totalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  )
}

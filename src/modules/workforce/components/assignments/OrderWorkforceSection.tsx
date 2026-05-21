"use client"

import { Users, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkerAssignmentCard } from "./WorkerAssignmentCard"
import { WorkerAssignmentDialog } from "./WorkerAssignmentDialog"
import type {
  SerializedOrderItemWorkerDetail,
  WorkerSummary,
} from "@/modules/workforce/types/workforce.types"

interface ServiceGroup {
  itemId: string
  itemName: string
  assignments: SerializedOrderItemWorkerDetail[]
}

interface Props {
  services: ServiceGroup[]
  activeWorkers: WorkerSummary[]
  orderRevenue: number
  currency: string
  orderStatus: string
}

export function OrderWorkforceSection({
  services,
  activeWorkers,
  orderRevenue,
  currency,
  orderStatus,
}: Props) {
  const isCancelled = orderStatus === "CANCELLED"
  const activeAssignments = services.flatMap((s) => s.assignments).filter((a) => a.status !== "CANCELLED")
  const totalCost = activeAssignments.reduce((sum, a) => sum + a.totalCost, 0)
  const estimatedProfit = orderRevenue - totalCost
  const profitMargin = orderRevenue > 0 ? (estimatedProfit / orderRevenue) * 100 : 0

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)

  const hasAnyAssignment = activeAssignments.length > 0

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Ekip phụ trách</CardTitle>
        </div>

        {hasAnyAssignment && (
          <div className="mt-3 flex items-center gap-6 border-t border-border pt-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Chi phí ekip</p>
              <p className="font-semibold tabular-nums">{fmt(totalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Doanh thu</p>
              <p className="font-semibold tabular-nums">{fmt(orderRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lợi nhuận ước tính</p>
              <p
                className={`font-semibold tabular-nums ${
                  estimatedProfit >= 0 ? "text-success-foreground" : "text-destructive"
                }`}
              >
                {estimatedProfit >= 0 ? "+" : ""}
                {fmt(estimatedProfit)}
                <span className="ml-1 text-xs font-normal opacity-70">
                  ({profitMargin.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {services.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có dịch vụ nào trong đơn hàng.
          </p>
        ) : (
          services.map((service) => {
            const activeCost = service.assignments
              .filter((a) => a.status !== "CANCELLED")
              .reduce((sum, a) => sum + a.totalCost, 0)
            const activeCount = service.assignments.filter((a) => a.status !== "CANCELLED").length

            return (
              <div key={service.itemId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {service.itemName}
                    </span>
                    {activeCount > 0 && (
                      <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {activeCount} người
                      </span>
                    )}
                    {activeCost > 0 && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        · {fmt(activeCost)}
                      </span>
                    )}
                  </div>
                  {!isCancelled && (
                    <WorkerAssignmentDialog
                      orderItemId={service.itemId}
                      orderItemName={service.itemName}
                      workers={activeWorkers}
                    >
                      <button
                        type="button"
                        className="flex h-7 flex-shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      >
                        <Plus className="h-3 w-3" />
                        Phân công
                      </button>
                    </WorkerAssignmentDialog>
                  )}
                </div>

                {service.assignments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-3">
                    <p className="text-xs text-muted-foreground">
                      Chưa có nhân viên nào được phân công.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {service.assignments.map((a) => (
                      <WorkerAssignmentCard key={a.id} assignment={a} orderCancelled={isCancelled} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

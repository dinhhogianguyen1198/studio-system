"use client"

import { Users, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
}

export function OrderWorkforceSection({
  services,
  activeWorkers,
  orderRevenue,
  currency,
}: Props) {
  const totalCost = services
    .flatMap((s) => s.assignments)
    .filter((a) => a.status !== "CANCELLED")
    .reduce((sum, a) => sum + a.totalCost, 0)

  const estimatedProfit = orderRevenue - totalCost
  const profitMargin = orderRevenue > 0 ? (estimatedProfit / orderRevenue) * 100 : 0

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)

  const hasAnyAssignment = services.some((s) => s.assignments.length > 0)

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Ekip phụ trách</CardTitle>
          </div>
          {hasAnyAssignment && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Chi phí:{" "}
                <span className="font-semibold text-foreground">{fmt(totalCost)}</span>
              </span>
              <span className={estimatedProfit >= 0 ? "text-green-600" : "text-destructive"}>
                Lợi nhuận ước tính:{" "}
                <span className="font-semibold">
                  {fmt(estimatedProfit)}{" "}
                  <span className="text-xs">({profitMargin.toFixed(1)}%)</span>
                </span>
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {services.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            Chưa có dịch vụ nào trong đơn hàng.
          </p>
        ) : (
          services.map((service, idx) => {
            const activeCost = service.assignments
              .filter((a) => a.status !== "CANCELLED")
              .reduce((sum, a) => sum + a.totalCost, 0)

            return (
              <div key={service.itemId}>
                {idx > 0 && <Separator className="mb-5" />}

                {/* Service header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{service.itemName}</span>
                    {service.assignments.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({service.assignments.filter((a) => a.status !== "CANCELLED").length} nhân viên
                        {activeCost > 0 && ` · ${fmt(activeCost)}`})
                      </span>
                    )}
                  </div>
                  <WorkerAssignmentDialog
                    orderItemId={service.itemId}
                    orderItemName={service.itemName}
                    workers={activeWorkers}
                  >
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Plus className="h-3 w-3" />
                      Phân công
                    </Button>
                  </WorkerAssignmentDialog>
                </div>

                {/* Assignment cards */}
                {service.assignments.length === 0 ? (
                  <p className="text-muted-foreground text-xs py-3 px-1">
                    Chưa có nhân viên nào được phân công cho dịch vụ này.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {service.assignments.map((a) => (
                      <WorkerAssignmentCard key={a.id} assignment={a} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Footer tổng */}
        {hasAnyAssignment && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-muted-foreground">Tổng chi phí ekip</span>
              <div className="flex items-center gap-6">
                <span className="tabular-nums font-semibold">{fmt(totalCost)}</span>
                <span className="text-muted-foreground">
                  Doanh thu:{" "}
                  <span className="tabular-nums text-foreground">{fmt(orderRevenue)}</span>
                </span>
                <span
                  className={`tabular-nums font-semibold ${
                    estimatedProfit >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {estimatedProfit >= 0 ? "+" : ""}
                  {fmt(estimatedProfit)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

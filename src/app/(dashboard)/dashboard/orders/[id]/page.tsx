import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { orderService } from "@/modules/orders/service/order.service"
import { orderManagementUnitService } from "@/modules/orders/service/order-management-unit.service"
import { OrderStatusBadge } from "@/modules/orders/components/orders/OrderStatusBadge"
import { OrderDetailInfoForm } from "@/modules/orders/components/orders/OrderDetailInfoForm"
import { OrderItemCard } from "@/modules/orders/components/order-items/OrderItemCard"
import { AddOrderItemDialog } from "@/modules/orders/components/order-items/AddOrderItemDialog"
import { PaymentHistoryCard } from "@/modules/orders/components/payments/PaymentHistoryCard"
import { OrderFeedbackSection } from "@/modules/orders/components/orders/OrderFeedbackSection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  serializeOrderItemSummary,
  serializeIncidentalCostSummary,
  type OrderItemSummary,
  type SerializedOrderItemSummary,
} from "@/modules/orders/types/orders.types"
import { IncidentalCostsCard } from "@/modules/orders/components/incidental-costs/IncidentalCostsCard"
import { workerAssignmentService } from "@/modules/workforce/service/worker-assignment.service"
import { workerService } from "@/modules/workforce/service/worker.service"
import { serializeOrderItemWorker } from "@/modules/workforce/types/workforce.types"
import { OrderWorkforceSection } from "@/modules/workforce/components/assignments/OrderWorkforceSection"
import { serviceDefinitionService } from "@/modules/services/service/service-definition.service"
import { serializeServiceDefinitionSummary } from "@/modules/services/types/services.types"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  await requirePermission("orders", "read")
  const { id } = await params

  const [order, activeWorkers, activeServices, managementUnits] = await Promise.all([
    orderService.findById(id).catch(() => null),
    workerService.getAllActiveWorkers(),
    serviceDefinitionService.findAllActive(),
    orderManagementUnitService.findAllActive(),
  ])
  if (!order) notFound()

  const serializedServices = activeServices.map(serializeServiceDefinitionSummary)

  const itemIds = order.items.map((item: OrderItemSummary) => item.id)

  const assignmentsMap = await workerAssignmentService.getAssignmentsByOrderItemIds(itemIds)

  const assignmentMap = Object.fromEntries(
    itemIds.map((itemId) => [
      itemId,
      (assignmentsMap.get(itemId) ?? []).map(serializeOrderItemWorker),
    ]),
  )

  const serializedItems = order.items.map(serializeOrderItemSummary)

  return (
    <div className="space-y-4">
      {/* Header compact: breadcrumb + tiêu đề trên cùng 1 khu vực */}
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard/orders"
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-xl font-bold">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {order.customer?.name ?? order.contactName}
            {order.contactPhone && ` • ${order.contactPhone}`}
            {order.contactEmail && ` • ${order.contactEmail}`}
            <span className="text-xs">
              {" "}— Tạo lúc {format(new Date(order.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })} bởi {order.createdBy.name}
            </span>
          </p>
        </div>
      </div>

      {order.status === "OVERDUE" && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Có dịch vụ trong đơn đang trễ hạn giao file.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left — services + workforce */}
        <div className="space-y-4 lg:col-span-2">
          {/* Danh sách sản phẩm */}
          <Card>
            <CardHeader className="border-b py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Danh sách dịch vụ ({serializedItems.length})</CardTitle>
                <AddOrderItemDialog orderId={order.id} services={serializedServices} />
              </div>
            </CardHeader>
            <CardContent className="pt-3 pb-3">
              {serializedItems.length === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
                  Chưa có dịch vụ nào. Nhấn &quot;Thêm dịch vụ&quot; để bắt đầu.
                </div>
              ) : (
                <div className="space-y-2">
                  {serializedItems.map((item: SerializedOrderItemSummary) => (
                    <OrderItemCard
                      key={item.id}
                      item={item}
                      orderId={order.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ekip phụ trách */}
          <OrderWorkforceSection
            services={serializedItems.map((item) => ({
              itemId: item.id,
              itemName: item.name,
              assignments: assignmentMap[item.id] ?? [],
            }))}
            activeWorkers={activeWorkers}
            orderRevenue={Number(order.totalAmount)}
            currency={order.currency}
            orderStatus={order.status}
          />
        </div>

        {/* Right — sidebar */}
        <div className="space-y-4">
          {/* Thông tin đơn hàng */}
          <OrderDetailInfoForm
            orderId={order.id}
            defaultValues={{
              partyName: order.partyName,
              notes: order.notes,
              internalNotes: order.internalNotes,
              orderManagementUnitId: order.orderManagementUnitId,
              orderManagementUnitName: order.orderManagementUnit?.name ?? null,
            }}
            managementUnits={managementUnits}
          />

          {/* Chi phí phát sinh */}
          <IncidentalCostsCard
            orderId={order.id}
            costs={order.incidentalCosts.map(serializeIncidentalCostSummary)}
          />

          {/* Thanh toán (summary + lịch sử gộp) */}
          <PaymentHistoryCard
            orderId={order.id}
            financial={{
              subtotal: Number(order.subtotal),
              incidentalCostsTotal: order.incidentalCosts.reduce((s, c) => s + Number(c.amount), 0),
              discountAmount: Number(order.discountAmount),
              totalAmount: Number(order.totalAmount),
              paidAmount: Number(order.paidAmount),
              currency: order.currency,
            }}
            payments={order.payments.map((p) => ({
              id: p.id,
              type: p.type,
              amount: Number(p.amount),
              method: p.method,
              reference: p.reference,
              note: p.note,
              paidAt: p.paidAt.toISOString(),
              recordedBy: p.recordedBy,
            }))}
          />

          {/* Phản hồi khách hàng */}
          <OrderFeedbackSection
            orderId={order.id}
            feedbacks={order.feedbacks.map((fb) => ({
              id: fb.id,
              content: fb.content,
              createdAt: fb.createdAt.toISOString(),
              createdBy: fb.createdBy,
            }))}
          />
        </div>
      </div>
    </div>
  )
}

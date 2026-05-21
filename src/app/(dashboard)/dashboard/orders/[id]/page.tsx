import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  ArrowLeft,
  PartyPopper,
  AlertTriangle,
} from "lucide-react"
import { requirePermission } from "@/shared/lib/auth-utils"
import { orderService } from "@/modules/orders/service/order.service"
import { db } from "@/shared/lib/prisma"
import { OrderStatusBadge } from "@/modules/orders/components/orders/OrderStatusBadge"
import { OrderDetailInfoForm } from "@/modules/orders/components/orders/OrderDetailInfoForm"
import { OrderItemCard } from "@/modules/orders/components/order-items/OrderItemCard"
import { WorkflowTimeline } from "@/modules/workflow/components/WorkflowTimeline"
import { RecordPaymentDialog } from "@/modules/orders/components/payments/RecordPaymentDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  PAYMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  serializeOrderItemSummary,
  type OrderItemSummary,
  type SerializedOrderItemSummary,
} from "@/modules/orders/types/orders.types"
import { workerAssignmentService } from "@/modules/workforce/service/worker-assignment.service"
import { workerService } from "@/modules/workforce/service/worker.service"
import { serializeOrderItemWorker } from "@/modules/workforce/types/workforce.types"
import { OrderWorkforceSection } from "@/modules/workforce/components/assignments/OrderWorkforceSection"

interface TransitionRow {
  id: string
  toStepId: string
  label: string | null
  requireNote: boolean
  toStep: { id: string; key: string; name: string; color: string | null; isFinal: boolean }
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  await requirePermission("orders", "read")
  const { id } = await params

  const [order, activeWorkers] = await Promise.all([
    orderService.findById(id).catch(() => null),
    workerService.getAllActiveWorkers(),
  ])
  if (!order) notFound()

  const itemAssignments = await Promise.all(
    order.items.map(async (item: OrderItemSummary) => {
      const assignments = await workerAssignmentService.getAssignmentsByOrderItem(item.id)
      return { itemId: item.id, assignments: assignments.map(serializeOrderItemWorker) }
    }),
  )
  const assignmentMap = Object.fromEntries(
    itemAssignments.map(({ itemId, assignments }) => [itemId, assignments]),
  )

  const itemTransitions = await Promise.all(
    order.items.map(async (item: OrderItemSummary) => {
      if (!item.currentStep) return { itemId: item.id, transitions: [] as TransitionRow[] }
      const transitions = await db.workflowStepTransition.findMany({
        where: { fromStepId: item.currentStep.id },
        select: {
          id: true,
          toStepId: true,
          label: true,
          requireNote: true,
          toStep: {
            select: { id: true, key: true, name: true, color: true, isFinal: true },
          },
        },
      })
      return { itemId: item.id, transitions }
    }),
  )

  const transitionMap: Record<string, TransitionRow[]> = Object.fromEntries(
    itemTransitions.map(({ itemId, transitions }) => [itemId, transitions]),
  )

  const serializedItems = order.items.map(serializeOrderItemSummary)
  const debt = Number(order.totalAmount) - Number(order.paidAmount)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Đơn hàng
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            {order.customer?.name ?? order.contactName}
            {order.contactPhone && ` • ${order.contactPhone}`}
            {order.contactEmail && ` • ${order.contactEmail}`}
          </p>
          <p className="text-muted-foreground text-xs">
            Tạo lúc {format(new Date(order.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })} bởi{" "}
            {order.createdBy.name}
          </p>
        </div>
      </div>

      {/* Overdue alert */}
      {order.status === "OVERDUE" && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Có dịch vụ trong đơn đang trễ hạn giao file.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — services + workforce */}
        <div className="space-y-4 lg:col-span-2">
          {/* Danh sách sản phẩm */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Danh sách sản phẩm ({serializedItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {serializedItems.length === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
                  Chưa có sản phẩm nào. Nhấn &quot;Thêm dịch vụ&quot; để bắt đầu.
                </div>
              ) : (
                <div className="space-y-4">
                  {serializedItems.map((item: SerializedOrderItemSummary) => (
                    <OrderItemCard
                      key={item.id}
                      item={item}
                      orderId={order.id}
                      availableTransitions={transitionMap[item.id] ?? []}
                      workflowTimeline={<WorkflowTimeline orderItemId={item.id} />}
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
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <PartyPopper className="size-4 text-primary" />
                Thông tin đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <OrderDetailInfoForm
                orderId={order.id}
                defaultValues={{
                  partyName: order.partyName,
                  notes: order.notes,
                  internalNotes: order.internalNotes,
                }}
              />
            </CardContent>
          </Card>

          {/* Tài chính */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Tổng thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="tabular-nums">
                  {Number(order.subtotal).toLocaleString("vi-VN")}
                </span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span className="text-destructive tabular-nums">
                    -{Number(order.discountAmount).toLocaleString("vi-VN")}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Tổng cộng</span>
                <span className="tabular-nums">
                  {Number(order.totalAmount).toLocaleString("vi-VN")} {order.currency}
                </span>
              </div>
              <div className="flex justify-between text-success-foreground">
                <span>Đã thanh toán</span>
                <span className="tabular-nums">
                  {Number(order.paidAmount).toLocaleString("vi-VN")}
                </span>
              </div>
              {debt > 0 && (
                <div className="flex justify-between font-semibold text-warning-foreground">
                  <span>Còn lại</span>
                  <span className="tabular-nums">{debt.toLocaleString("vi-VN")}</span>
                </div>
              )}
              <div className="pt-2">
                <RecordPaymentDialog orderId={order.id} />
              </div>
            </CardContent>
          </Card>

          {/* Lịch sử thanh toán */}
          {order.payments.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Lịch sử thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {order.payments.map((p) => (
                  <div key={p.id} className="text-sm">
                    <div className="flex justify-between font-medium">
                      <span>{PAYMENT_TYPE_LABELS[p.type] ?? p.type}</span>
                      <span className="tabular-nums">
                        {Number(p.amount).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {PAYMENT_METHOD_LABELS[p.method]} •{" "}
                      {format(new Date(p.paidAt), "dd/MM/yyyy", { locale: vi })}
                      {p.reference && ` • ${p.reference}`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

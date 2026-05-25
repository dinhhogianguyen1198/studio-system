"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { db } from "@/shared/lib/prisma"
import { orderItemService } from "../service/order-item.service"
import { orderService } from "../service/order.service"
import { addOrderItemSchema, updateOrderItemSchema, recordPaymentSchema, updatePaymentSchema, createOrderFeedbackSchema, createIncidentalCostSchema, updateIncidentalCostSchema } from "../schemas/orders.schema"
import { orderRepository } from "../repository/order.repository"
import type { PaymentType, PaymentMethod } from "@prisma/client"

const ERROR_MESSAGES: Record<string, string> = {
  ORDER_ITEM_NOT_FOUND: "Dịch vụ không tồn tại trong đơn hàng",
  SERVICE_DEFINITION_NOT_FOUND: "Dịch vụ không tồn tại",
}

export async function addOrderItemAction(
  orderId: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_items", "create")
  const parsed = addOrderItemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const item = await orderItemService.add(parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "order_items",
      resourceId: item.id,
      metadata: { orderId, serviceName: item.name },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Thêm dịch vụ thất bại") }
  }
}

export async function updateOrderItemAction(
  itemId: string,
  orderId: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_items", "update")
  const parsed = updateOrderItemSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await orderItemService.update(itemId, parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "order_items",
      resourceId: itemId,
      metadata: { orderId, ...parsed.data },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật dịch vụ thất bại") }
  }
}

export async function updateOrderItemDeliveryStatusAction(
  itemId: string,
  orderId: string,
  deliveryStatus: "PENDING" | "DELIVERED",
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_items", "update")
  try {
    await orderItemService.updateDeliveryStatus(itemId, deliveryStatus)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "order_items",
      resourceId: itemId,
      metadata: { orderId, deliveryStatus },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật trạng thái giao file thất bại") }
  }
}

export async function removeOrderItemAction(itemId: string, orderId: string): Promise<ActionResult<void>> {
  const session = await requirePermission("order_items", "delete")
  try {
    await orderItemService.remove(itemId)
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "order_items",
      resourceId: itemId,
      metadata: { orderId },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Xóa dịch vụ thất bại") }
  }
}

export async function assignOrderItemStaffAction(
  itemId: string,
  orderId: string,
  assignedToId: string | null,
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_item_assignment", "update")
  try {
    await orderItemService.assignStaff(itemId, assignedToId)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "order_item_assignment",
      resourceId: itemId,
      metadata: { orderId, assignedToId },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Phân công thất bại") }
  }
}

export async function updatePaymentAction(
  paymentId: string,
  orderId: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_payments", "update")
  const parsed = updatePaymentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await db.orderPayment.update({
      where: { id: paymentId },
      data: {
        type: parsed.data.type as PaymentType,
        amount: parsed.data.amount,
        method: parsed.data.method as PaymentMethod,
        reference: parsed.data.reference,
        note: parsed.data.note,
        paidAt: parsed.data.paidAt,
      },
    })
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "order_payments",
      resourceId: paymentId,
      metadata: { orderId, type: parsed.data.type, amount: parsed.data.amount },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Cập nhật thanh toán thất bại") }
  }
}

export async function deletePaymentAction(
  paymentId: string,
  orderId: string,
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_payments", "delete")
  try {
    await db.orderPayment.delete({ where: { id: paymentId } })
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "order_payments",
      resourceId: paymentId,
      metadata: { orderId },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Xóa thanh toán thất bại") }
  }
}

export async function createOrderFeedbackAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("orders", "update")
  const parsed = createOrderFeedbackSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await db.orderFeedback.create({
      data: {
        orderId: parsed.data.orderId,
        content: parsed.data.content,
        createdById: session.user.id,
      },
    })
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "order_feedbacks",
      resourceId: parsed.data.orderId,
      metadata: { orderId: parsed.data.orderId },
    })
    revalidatePath(`/dashboard/orders/${parsed.data.orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Ghi nhận phản hồi thất bại") }
  }
}

export async function deleteOrderFeedbackAction(
  feedbackId: string,
  orderId: string,
): Promise<ActionResult<void>> {
  const session = await requirePermission("orders", "update")
  try {
    await db.orderFeedback.delete({ where: { id: feedbackId } })
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "order_feedbacks",
      resourceId: feedbackId,
      metadata: { orderId },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Xóa phản hồi thất bại") }
  }
}

export async function createIncidentalCostAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("orders", "update")
  const parsed = createIncidentalCostSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await db.orderIncidentalCost.create({
      data: {
        orderId: parsed.data.orderId,
        reason: parsed.data.reason,
        amount: parsed.data.amount,
        notes: parsed.data.notes,
        createdById: session.user.id,
      },
    })
    await orderRepository.recalculateTotals(parsed.data.orderId)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "order_incidental_costs",
      resourceId: parsed.data.orderId,
      metadata: { orderId: parsed.data.orderId, reason: parsed.data.reason, amount: parsed.data.amount },
    })
    revalidatePath(`/dashboard/orders/${parsed.data.orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Thêm chi phí thất bại") }
  }
}

export async function updateIncidentalCostAction(
  costId: string,
  orderId: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("orders", "update")
  const parsed = updateIncidentalCostSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await db.orderIncidentalCost.update({
      where: { id: costId },
      data: {
        reason: parsed.data.reason,
        amount: parsed.data.amount,
        notes: parsed.data.notes ?? null,
      },
    })
    await orderRepository.recalculateTotals(orderId)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "order_incidental_costs",
      resourceId: costId,
      metadata: { orderId, reason: parsed.data.reason, amount: parsed.data.amount },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Cập nhật chi phí thất bại") }
  }
}

export async function deleteIncidentalCostAction(
  costId: string,
  orderId: string,
): Promise<ActionResult<void>> {
  const session = await requirePermission("orders", "update")
  try {
    await db.orderIncidentalCost.delete({ where: { id: costId } })
    await orderRepository.recalculateTotals(orderId)
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "order_incidental_costs",
      resourceId: costId,
      metadata: { orderId },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Xóa chi phí thất bại") }
  }
}

export async function recordPaymentAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_payments", "create")
  const parsed = recordPaymentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await orderService.recordPayment({ ...parsed.data, recordedById: session.user.id })
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "order_payments",
      resourceId: parsed.data.orderId,
      metadata: { type: parsed.data.type, amount: parsed.data.amount },
    })
    revalidatePath(`/dashboard/orders/${parsed.data.orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Ghi nhận thanh toán thất bại") }
  }
}

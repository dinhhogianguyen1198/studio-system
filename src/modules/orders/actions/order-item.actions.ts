"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { orderItemService } from "../service/order-item.service"
import { addOrderItemSchema, updateOrderItemSchema, recordPaymentSchema } from "../schemas/orders.schema"

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

export async function recordPaymentAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_payments", "create")
  const parsed = recordPaymentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await orderItemService.recordPayment({ ...parsed.data, recordedById: session.user.id })
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

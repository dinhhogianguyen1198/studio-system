"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { orderService } from "../service/order.service"
import { orderItemService } from "../service/order-item.service"
import { customerService } from "@/modules/crm/service/customer.service"
import {
  createOrderSchema,
  updateOrderSchema,
  createOrderWithItemsSchema,
  orderItemInputSchema,
} from "../schemas/orders.schema"

const ERROR_MESSAGES: Record<string, string> = {
  ORDER_NOT_FOUND: "Đơn hàng không tồn tại",
  ORDER_CANNOT_BE_DELETED: "Chỉ có thể xóa đơn Mới tạo hoặc Hoàn thành",
}

export async function createOrderAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("orders", "create")
  const parsed = createOrderSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const order = await orderService.create(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "orders",
      resourceId: order.id,
      metadata: { orderNumber: order.orderNumber, contactName: order.contactName },
    })
    revalidatePath("/dashboard/orders")
    return { success: true, data: { id: order.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Tạo đơn hàng thất bại") }
  }
}

export async function createOrderWithItemsAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("orders", "create")
  const parsed = createOrderWithItemsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  const { itemsJson, newCustomerAddress, ...orderData } = parsed.data

  let items: z.infer<typeof orderItemInputSchema>[] = []
  if (itemsJson) {
    try {
      items = z.array(orderItemInputSchema).parse(JSON.parse(itemsJson))
    } catch {
      return { success: false, error: "Dữ liệu dịch vụ không hợp lệ" }
    }
  }

  try {
    let customerId = orderData.customerId || undefined
    if (!customerId && orderData.contactName) {
      const customer = await customerService.createCustomer(
        {
          name: orderData.contactName,
          phone: orderData.contactPhone || undefined,
          email: orderData.contactEmail || undefined,
          address: newCustomerAddress || undefined,
        },
        session.user.id,
      )
      customerId = customer.id
      revalidatePath("/dashboard/customers")
    }

    const order = await orderService.create({ ...orderData, customerId }, session.user.id)

    for (const item of items) {
      await orderItemService.add({ ...item, orderId: order.id })
    }

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "orders",
      resourceId: order.id,
      metadata: { orderNumber: order.orderNumber, contactName: order.contactName, itemCount: items.length },
    })
    revalidatePath("/dashboard/orders")
    return { success: true, data: { id: order.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Tạo đơn hàng thất bại") }
  }
}

export async function updateOrderAction(
  id: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("orders", "update")
  const parsed = updateOrderSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await orderService.update(id, parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "orders",
      resourceId: id,
      metadata: parsed.data,
    })
    revalidatePath(`/dashboard/orders/${id}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật thất bại") }
  }
}

export async function deleteOrderAction(id: string): Promise<ActionResult<void>> {
  const session = await requirePermission("orders", "delete")
  try {
    await orderService.delete(id)
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "orders",
      resourceId: id,
    })
    revalidatePath("/dashboard/orders")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Xóa đơn thất bại") }
  }
}

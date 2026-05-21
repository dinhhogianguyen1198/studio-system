"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { orderManagementUnitService } from "../service/order-management-unit.service"
import {
  createOrderManagementUnitSchema,
  updateOrderManagementUnitSchema,
} from "../schemas/order-management-unit.schema"

const REVALIDATE_PATH = "/dashboard/settings/order-management-units"

const ERROR_MESSAGES: Record<string, string> = {
  ORDER_MANAGEMENT_UNIT_NOT_FOUND: "Đơn vị quản lý không tồn tại",
  ORDER_MANAGEMENT_UNIT_NAME_DUPLICATE: "Tên đơn vị quản lý này đã được sử dụng",
}

export async function createOrderManagementUnitAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("order_management_units", "create")
  const parsed = createOrderManagementUnitSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const unit = await orderManagementUnitService.create(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "order_management_units",
      resourceId: unit.id,
      metadata: { name: unit.name },
    })
    revalidatePath(REVALIDATE_PATH)
    return { success: true, data: { id: unit.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Tạo thất bại") }
  }
}

export async function updateOrderManagementUnitAction(
  id: string,
  _prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("order_management_units", "update")
  const parsed = updateOrderManagementUnitSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await orderManagementUnitService.update(id, parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "order_management_units",
      resourceId: id,
      metadata: parsed.data,
    })
    revalidatePath(REVALIDATE_PATH)
    return { success: true, data: { id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật thất bại") }
  }
}

export async function deleteOrderManagementUnitAction(id: string): Promise<ActionResult<void>> {
  const session = await requirePermission("order_management_units", "delete")
  try {
    await orderManagementUnitService.delete(id)
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "order_management_units",
      resourceId: id,
    })
    revalidatePath(REVALIDATE_PATH)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Xóa thất bại") }
  }
}

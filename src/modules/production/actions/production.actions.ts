"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import { productionService } from "../service/production.service"
import type { KanbanTransitionType } from "../types/production.types"
import type { ActionResult } from "@/shared/types/api.types"

export async function moveOrderAction(
  orderId: string,
  toStatus: string,
  transitionType: KanbanTransitionType,
): Promise<ActionResult<{ newStatus: string }>> {
  const session = await requirePermission("orders", "update")

  try {
    const result = await productionService.executeTransition(
      orderId,
      transitionType,
      session.user.id,
    )

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "orders",
      resourceId: orderId,
      metadata: { transition: transitionType, toStatus, newStatus: result.newStatus },
    })

    revalidatePath("/dashboard/production/kanban")
    revalidatePath("/dashboard/production/calendar")
    revalidatePath(`/dashboard/orders/${orderId}`)

    return { success: true, data: result }
  } catch (err) {
    return {
      success: false,
      error: toActionError(err, "Không thể cập nhật trạng thái đơn hàng"),
    }
  }
}

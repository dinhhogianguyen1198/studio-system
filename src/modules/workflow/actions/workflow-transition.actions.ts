"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { workflowTransitionService } from "../service/workflow-transition.service"
import { workflowTransitionRequestSchema } from "../schemas/workflow.schema"

const ERROR_MESSAGES: Record<string, string> = {
  ORDER_ITEM_NOT_FOUND: "Dịch vụ không tồn tại trong đơn hàng",
  ORDER_ITEM_HAS_NO_WORKFLOW: "Dịch vụ này chưa được cấu hình workflow",
  INVALID_TRANSITION: "Chuyển trạng thái không hợp lệ",
  NOTE_REQUIRED_FOR_TRANSITION: "Bước này yêu cầu ghi chú khi chuyển trạng thái",
  WORKFLOW_STEP_NOT_FOUND: "Bước workflow không tồn tại",
}

export async function transitionOrderItemAction(
  orderId: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("order_item_workflow", "update")

  const parsed = workflowTransitionRequestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await workflowTransitionService.transition(
      parsed.data.orderItemId,
      parsed.data.targetStepId,
      parsed.data.note,
      session.user.id,
    )
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "order_item_workflow",
      resourceId: parsed.data.orderItemId,
      metadata: { targetStepId: parsed.data.targetStepId, orderId },
    })
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return {
      success: false,
      error: ERROR_MESSAGES[code] ?? toActionError(err, "Chuyển trạng thái thất bại"),
    }
  }
}

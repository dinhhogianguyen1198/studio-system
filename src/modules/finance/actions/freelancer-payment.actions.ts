"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import {
  createFreelancerPaymentSchema,
  processFreelancerPaymentSchema,
} from "../schemas/finance.schema"
import { freelancerPaymentService } from "../service/freelancer-payment.service"
import type { UnpaidAssignment } from "../types/finance.types"

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Không tìm thấy phiếu thanh toán",
  NO_VALID_ASSIGNMENTS: "Không có công việc hợp lệ được chọn",
  PAYMENT_ALREADY_PAID: "Phiếu thanh toán đã được thanh toán",
  PAYMENT_CANCELLED: "Phiếu thanh toán đã bị hủy",
  CANNOT_CANCEL_PAID_PAYMENT: "Không thể hủy phiếu đã thanh toán",
}

export async function getUnpaidAssignmentsAction(
  workerId: string,
): Promise<ActionResult<UnpaidAssignment[]>> {
  await requirePermission("finance_payroll", "read")
  try {
    const data = await freelancerPaymentService.getUnpaidAssignments(workerId)
    return { success: true, data: data as UnpaidAssignment[] }
  } catch (err) {
    return { success: false, error: toActionError(err, "Lỗi khi tải công việc") }
  }
}

export async function createFreelancerPaymentAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("finance_payroll", "create")

  const raw = Object.fromEntries(formData)
  let assignmentIds: string[] = []
  try {
    assignmentIds = JSON.parse(raw.assignmentIds as string)
  } catch {
    return { success: false, error: "Danh sách công việc không hợp lệ" }
  }

  const parsed = createFreelancerPaymentSchema.safeParse({ ...raw, assignmentIds })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const payment = await freelancerPaymentService.create(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "finance_payroll",
      resourceId: payment.id,
      metadata: {
        workerId: parsed.data.workerId,
        totalAmount: payment.totalAmount.toString(),
        itemCount: payment.items.length,
      },
    })
    revalidatePath("/dashboard/finance/payroll")
    return { success: true, data: { id: payment.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Tạo phiếu thất bại") }
  }
}

export async function processFreelancerPaymentAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_payroll", "update")

  const raw = Object.fromEntries(formData)
  const parsed = processFreelancerPaymentSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const payment = await freelancerPaymentService.process(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_payroll",
      resourceId: payment.id,
      metadata: {
        action: "PAID",
        totalAmount: payment.totalAmount.toString(),
        method: parsed.data.paymentMethod,
      },
    })
    revalidatePath("/dashboard/finance/payroll")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Thanh toán thất bại") }
  }
}

export async function cancelFreelancerPaymentAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_payroll", "update")

  const id = formData.get("id") as string
  if (!id) return { success: false, error: "ID không hợp lệ" }

  try {
    await freelancerPaymentService.cancel(id)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_payroll",
      resourceId: id,
      metadata: { action: "CANCELLED" },
    })
    revalidatePath("/dashboard/finance/payroll")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Hủy thất bại") }
  }
}

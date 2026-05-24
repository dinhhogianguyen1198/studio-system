"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import {
  assignWorkerSchema,
  updateAssignmentStatusSchema,
} from "@/modules/workforce/schemas/workforce.schema"
import { workerAssignmentService } from "@/modules/workforce/service/worker-assignment.service"
import {
  serializeOrderItemWorker,
  type SerializedOrderItemWorkerDetail,
} from "@/modules/workforce/types/workforce.types"

const ASSIGNMENT_ERROR_MESSAGES: Record<string, string> = {
  ASSIGNMENT_NOT_FOUND: "Không tìm thấy phân công",
  DUPLICATE_ASSIGNMENT: "Nhân viên đã được phân công vào dịch vụ này với vai trò này",
  WORKER_NOT_FOUND: "Không tìm thấy nhân viên",
  JOB_TYPE_NOT_FOUND: "Không tìm thấy loại công việc",
  WORKER_MISSING_SKILL: "Nhân viên không có kỹ năng này",
  NO_RATE_CONFIGURED: "Chưa cấu hình mức lương cho nhân viên với vai trò này",
  CANNOT_REMOVE_COMPLETED_ASSIGNMENT: "Không thể xóa phân công đã hoàn thành",
  INVALID_STATUS_TRANSITION: "Không thể chuyển trạng thái này",
  ALREADY_PAID: "Phân công này đã được thanh toán",
  UNKNOWN: "Thao tác thất bại",
}

export async function assignWorkerAction(
  prevState: ActionResult<SerializedOrderItemWorkerDetail>,
  formData: FormData,
): Promise<ActionResult<SerializedOrderItemWorkerDetail>> {
  const session = await requirePermission("workforce_assignments", "create")

  const raw = Object.fromEntries(formData)
  const parsed = assignWorkerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const assignment = await workerAssignmentService.assignWorker(parsed.data, session.user.id)

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "workforce_assignments",
      resourceId: assignment.id,
      metadata: {
        orderItemId: assignment.orderItemId,
        workerId: assignment.workerId,
        workerName: assignment.workerNameSnapshot,
        jobType: assignment.jobTypeNameSnapshot,
      },
    })

    revalidatePath(`/dashboard/orders`)
    revalidatePath(`/dashboard/workforce/payroll`)
    return { success: true, data: serializeOrderItemWorker(assignment) }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return {
      success: false,
      error: ASSIGNMENT_ERROR_MESSAGES[code] ?? toActionError(err, "Phân công thất bại"),
    }
  }
}

export async function updateAssignmentStatusAction(
  prevState: ActionResult<SerializedOrderItemWorkerDetail>,
  formData: FormData,
): Promise<ActionResult<SerializedOrderItemWorkerDetail>> {
  const session = await requirePermission("workforce_assignments", "update")

  const raw = Object.fromEntries(formData)
  const parsed = updateAssignmentStatusSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const assignment = await workerAssignmentService.updateAssignmentStatus(parsed.data, session.user.id)

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workforce_assignments",
      resourceId: assignment.id,
      metadata: { status: assignment.status },
    })

    revalidatePath(`/dashboard/orders`)
    revalidatePath(`/dashboard/workforce/payroll`)
    return { success: true, data: serializeOrderItemWorker(assignment) }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return {
      success: false,
      error: ASSIGNMENT_ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật trạng thái thất bại"),
    }
  }
}

export async function markAssignmentAsPaidAction(id: string): Promise<ActionResult<void>> {
  const session = await requirePermission("workforce_assignments", "update")

  try {
    const assignment = await workerAssignmentService.markAsPaid(id)

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workforce_assignments",
      resourceId: assignment.id,
      metadata: { paidAt: assignment.paidAt, workerName: assignment.workerNameSnapshot },
    })

    revalidatePath(`/dashboard/orders`)
    revalidatePath(`/dashboard/workforce/payroll`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return {
      success: false,
      error: ASSIGNMENT_ERROR_MESSAGES[code] ?? toActionError(err, "Đánh dấu thanh toán thất bại"),
    }
  }
}

export async function markMultipleAsPaidAction(
  ids: string[],
): Promise<ActionResult<{ count: number }>> {
  const session = await requirePermission("workforce_assignments", "update")

  if (ids.length === 0) return { success: true, data: { count: 0 } }

  try {
    const result = await workerAssignmentService.markMultiplePaid(ids)

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workforce_assignments",
      resourceId: ids[0],
      metadata: { paidCount: result.count, ids },
    })

    revalidatePath(`/dashboard/orders`)
    revalidatePath(`/dashboard/workforce/payroll`)
    return { success: true, data: result }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return {
      success: false,
      error: ASSIGNMENT_ERROR_MESSAGES[code] ?? toActionError(err, "Thanh toán thất bại"),
    }
  }
}

export async function removeAssignmentAction(id: string): Promise<ActionResult<void>> {
  const session = await requirePermission("workforce_assignments", "delete")

  try {
    await workerAssignmentService.removeAssignment(id)

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "workforce_assignments",
      resourceId: id,
      metadata: {},
    })

    revalidatePath(`/dashboard/orders`)
    revalidatePath(`/dashboard/workforce/payroll`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return {
      success: false,
      error: ASSIGNMENT_ERROR_MESSAGES[code] ?? toActionError(err, "Xóa phân công thất bại"),
    }
  }
}

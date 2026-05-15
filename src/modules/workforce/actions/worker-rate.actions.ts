"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import { db } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/api.types"
import { upsertWorkerRateSchema } from "@/modules/workforce/schemas/workforce.schema"

const RATE_ERROR_MESSAGES: Record<string, string> = {
  WORKER_NOT_FOUND: "Không tìm thấy nhân viên",
  JOB_TYPE_NOT_FOUND: "Không tìm thấy loại công việc",
  UNKNOWN: "Thao tác thất bại",
}

export async function upsertWorkerRateAction(
  prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("workforce_workers", "update")

  const raw = Object.fromEntries(formData)
  const parsed = upsertWorkerRateSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const {
    workerId,
    jobTypeId,
    serviceDefinitionId,
    rateType,
    amount,
    currency,
    effectiveFrom,
    effectiveTo,
    note,
  } = parsed.data

  try {
    // Deactivate any existing active rates for the same worker/jobType/serviceDefinition/rateType
    await db.workerRate.updateMany({
      where: {
        workerId,
        jobTypeId,
        serviceDefinitionId: serviceDefinitionId ?? null,
        rateType,
        isActive: true,
      },
      data: { isActive: false, effectiveTo: effectiveFrom },
    })

    const rate = await db.workerRate.create({
      data: {
        workerId,
        jobTypeId,
        serviceDefinitionId: serviceDefinitionId ?? null,
        rateType,
        amount,
        currency,
        effectiveFrom,
        effectiveTo: effectiveTo ?? null,
        note: note ?? null,
        isActive: true,
      },
      select: { id: true },
    })

    await writeAuditLog({
      userId: session.user.id,
      action: "UPSERT",
      resource: "workforce_workers",
      resourceId: workerId,
      metadata: { rateId: rate.id, rateType, amount: amount.toString() },
    })

    revalidatePath(`/dashboard/workforce/workers/${workerId}`)
    return { success: true, data: { id: rate.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return {
      success: false,
      error:
        RATE_ERROR_MESSAGES[code] ?? toActionError(err, "Lưu mức lương thất bại"),
    }
  }
}

export async function deactivateWorkerRateAction(
  rateId: string,
  workerId: string,
): Promise<ActionResult<void>> {
  const session = await requirePermission("workforce_workers", "update")

  try {
    await db.workerRate.update({
      where: { id: rateId },
      data: { isActive: false },
    })

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workforce_workers",
      resourceId: workerId,
      metadata: { rateId, action: "deactivate" },
    })

    revalidatePath(`/dashboard/workforce/workers/${workerId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: toActionError(err, "Không thể hủy kích hoạt mức lương"),
    }
  }
}

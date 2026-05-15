"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { createWorkerSchema, updateWorkerSchema } from "@/modules/workforce/schemas/workforce.schema"
import { workerService } from "@/modules/workforce/service/worker.service"

const WORKER_ERROR_MESSAGES: Record<string, string> = {
  WORKER_NOT_FOUND: "Không tìm thấy nhân viên",
  DUPLICATE_WORKER_EMAIL: "Email đã được sử dụng bởi nhân viên khác",
  UNKNOWN: "Thao tác thất bại",
}

export async function createWorkerAction(
  prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("workforce_workers", "create")

  const raw = Object.fromEntries(formData)
  const parsed = createWorkerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const worker = await workerService.createWorker(parsed.data, session.user.id)

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "workforce_workers",
      resourceId: worker.id,
      metadata: { name: worker.name },
    })

    revalidatePath("/dashboard/workforce/workers")
    return { success: true, data: { id: worker.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: WORKER_ERROR_MESSAGES[code] ?? toActionError(err, "Tạo nhân viên thất bại") }
  }
}

export async function updateWorkerAction(
  prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("workforce_workers", "update")

  const raw = Object.fromEntries(formData)
  const parsed = updateWorkerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const worker = await workerService.updateWorker(parsed.data, session.user.id)

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workforce_workers",
      resourceId: worker.id,
      metadata: { name: worker.name },
    })

    revalidatePath("/dashboard/workforce/workers")
    revalidatePath(`/dashboard/workforce/workers/${worker.id}`)
    return { success: true, data: { id: worker.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: WORKER_ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật thất bại") }
  }
}

export async function deleteWorkerAction(id: string): Promise<ActionResult<void>> {
  const session = await requirePermission("workforce_workers", "delete")

  try {
    await workerService.deleteWorker(id)

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "workforce_workers",
      resourceId: id,
      metadata: {},
    })

    revalidatePath("/dashboard/workforce/workers")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: WORKER_ERROR_MESSAGES[code] ?? toActionError(err, "Xóa thất bại") }
  }
}

"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { createJobTypeSchema, updateJobTypeSchema } from "@/modules/workforce/schemas/workforce.schema"
import { jobTypeService } from "@/modules/workforce/service/job-type.service"

const JOB_TYPE_ERROR_MESSAGES: Record<string, string> = {
  JOB_TYPE_NOT_FOUND: "Không tìm thấy loại công việc",
  DUPLICATE_JOB_TYPE_NAME: "Tên loại công việc đã tồn tại",
  DUPLICATE_JOB_TYPE_SLUG: "Slug đã được sử dụng",
  JOB_TYPE_HAS_WORKERS: "Không thể xóa loại công việc đang có nhân viên",
  UNKNOWN: "Thao tác thất bại",
}

export async function createJobTypeAction(
  prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("workforce_job_types", "create")

  const raw = Object.fromEntries(formData)
  const parsed = createJobTypeSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const jobType = await jobTypeService.createJobType(parsed.data, session.user.id)

    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "workforce_job_types",
      resourceId: jobType.id,
      metadata: { name: jobType.name, slug: jobType.slug },
    })

    revalidatePath("/dashboard/workforce/job-types")
    return { success: true, data: { id: jobType.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: JOB_TYPE_ERROR_MESSAGES[code] ?? toActionError(err, "Tạo loại công việc thất bại") }
  }
}

export async function updateJobTypeAction(
  prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("workforce_job_types", "update")

  const raw = Object.fromEntries(formData)
  const parsed = updateJobTypeSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const jobType = await jobTypeService.updateJobType(parsed.data)

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workforce_job_types",
      resourceId: jobType.id,
      metadata: { name: jobType.name },
    })

    revalidatePath("/dashboard/workforce/job-types")
    return { success: true, data: { id: jobType.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: JOB_TYPE_ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật thất bại") }
  }
}

export async function deleteJobTypeAction(id: string): Promise<ActionResult<void>> {
  const session = await requirePermission("workforce_job_types", "delete")

  try {
    await jobTypeService.deleteJobType(id)

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "workforce_job_types",
      resourceId: id,
      metadata: {},
    })

    revalidatePath("/dashboard/workforce/job-types")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: JOB_TYPE_ERROR_MESSAGES[code] ?? toActionError(err, "Xóa thất bại") }
  }
}

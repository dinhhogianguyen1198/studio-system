"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { serviceDefinitionService } from "../service/service-definition.service"
import {
  createServiceDefinitionSchema,
  updateServiceDefinitionSchema,
} from "../schemas/services.schema"

const ERROR_MESSAGES: Record<string, string> = {
  SERVICE_DEFINITION_NOT_FOUND: "Dịch vụ không tồn tại",
  SERVICE_DEFINITION_SLUG_DUPLICATE: "Slug này đã được sử dụng",
}

export async function createServiceDefinitionAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("service_catalog", "create")
  const parsed = createServiceDefinitionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const service = await serviceDefinitionService.create(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "service_catalog",
      resourceId: service.id,
      metadata: { name: service.name },
    })
    revalidatePath("/dashboard/services")
    return { success: true, data: { id: service.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Tạo dịch vụ thất bại") }
  }
}

export async function updateServiceDefinitionAction(
  id: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("service_catalog", "update")
  const parsed = updateServiceDefinitionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await serviceDefinitionService.update(id, parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "service_catalog",
      resourceId: id,
      metadata: parsed.data,
    })
    revalidatePath("/dashboard/services")
    revalidatePath(`/dashboard/services/${id}/edit`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật thất bại") }
  }
}

export async function deleteServiceDefinitionAction(id: string): Promise<ActionResult<void>> {
  const session = await requirePermission("service_catalog", "delete")
  try {
    await serviceDefinitionService.delete(id)
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "service_catalog",
      resourceId: id,
    })
    revalidatePath("/dashboard/services")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Xóa thất bại") }
  }
}

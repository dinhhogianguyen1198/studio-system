"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import { workflowTemplateService } from "../service/workflow-template.service"
import {
  createWorkflowTemplateSchema,
  createWorkflowStepSchema,
  createWorkflowTransitionSchema,
  updateWorkflowTemplateSchema,
  updateWorkflowStepSchema,
} from "../schemas/workflow.schema"

const ERROR_MESSAGES: Record<string, string> = {
  WORKFLOW_TEMPLATE_NOT_FOUND: "Template không tồn tại",
  WORKFLOW_TEMPLATE_HAS_STEPS: "Không thể xóa template đang có bước workflow",
  SELF_TRANSITION_NOT_ALLOWED: "Không thể tạo transition từ một bước về chính nó",
}

// ─── Template CRUD ─────────────────────────────────────────────────────────────

export async function createWorkflowTemplateAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("workflow_templates", "create")
  const parsed = createWorkflowTemplateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const template = await workflowTemplateService.create(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "workflow_templates",
      resourceId: template.id,
      metadata: { name: template.name },
    })
    revalidatePath("/dashboard/workflow/templates")
    return { success: true, data: { id: template.id } }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Tạo template thất bại") }
  }
}

export async function updateWorkflowTemplateAction(
  id: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("workflow_templates", "update")
  const parsed = updateWorkflowTemplateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await workflowTemplateService.update(id, parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workflow_templates",
      resourceId: id,
      metadata: parsed.data,
    })
    revalidatePath(`/dashboard/workflow/templates/${id}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật thất bại") }
  }
}

export async function deleteWorkflowTemplateAction(id: string): Promise<ActionResult<void>> {
  const session = await requirePermission("workflow_templates", "delete")
  try {
    await workflowTemplateService.delete(id)
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "workflow_templates",
      resourceId: id,
    })
    revalidatePath("/dashboard/workflow/templates")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Xóa thất bại") }
  }
}

// ─── Step CRUD ─────────────────────────────────────────────────────────────────

export async function createWorkflowStepAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("workflow_templates", "update")
  const parsed = createWorkflowStepSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await workflowTemplateService.createStep(parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workflow_templates",
      resourceId: parsed.data.templateId,
      metadata: { action: "ADD_STEP", stepKey: parsed.data.key },
    })
    revalidatePath(`/dashboard/workflow/templates/${parsed.data.templateId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Thêm bước thất bại") }
  }
}

export async function updateWorkflowStepAction(
  stepId: string,
  templateId: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("workflow_templates", "update")
  const parsed = updateWorkflowStepSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await workflowTemplateService.updateStep(stepId, parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workflow_templates",
      resourceId: templateId,
      metadata: { action: "UPDATE_STEP", stepId },
    })
    revalidatePath(`/dashboard/workflow/templates/${templateId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Cập nhật bước thất bại") }
  }
}

export async function deleteWorkflowStepAction(
  stepId: string,
  templateId: string,
): Promise<ActionResult<void>> {
  const session = await requirePermission("workflow_templates", "delete")
  try {
    await workflowTemplateService.deleteStep(stepId)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workflow_templates",
      resourceId: templateId,
      metadata: { action: "DELETE_STEP", stepId },
    })
    revalidatePath(`/dashboard/workflow/templates/${templateId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Xóa bước thất bại") }
  }
}

// ─── Transition CRUD ───────────────────────────────────────────────────────────

export async function createWorkflowTransitionAction(
  templateId: string,
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("workflow_templates", "update")
  const parsed = createWorkflowTransitionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    await workflowTemplateService.createTransition(parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workflow_templates",
      resourceId: templateId,
      metadata: { action: "ADD_TRANSITION", ...parsed.data },
    })
    revalidatePath(`/dashboard/workflow/templates/${templateId}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Thêm transition thất bại") }
  }
}

export async function deleteWorkflowTransitionAction(
  fromStepId: string,
  toStepId: string,
  templateId: string,
): Promise<ActionResult<void>> {
  const session = await requirePermission("workflow_templates", "delete")
  try {
    await workflowTemplateService.deleteTransition(fromStepId, toStepId)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "workflow_templates",
      resourceId: templateId,
      metadata: { action: "DELETE_TRANSITION", fromStepId, toStepId },
    })
    revalidatePath(`/dashboard/workflow/templates/${templateId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Xóa transition thất bại") }
  }
}

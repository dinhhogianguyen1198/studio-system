"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { leadService } from "../service/lead.service"
import {
  createLeadSchema,
  updateLeadSchema,
  createNoteSchema,
} from "../schemas/crm.schema"
import { requireSession } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import type { ActionResult } from "@/shared/types/api.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getRequestMeta() {
  const h = await headers()
  return {
    ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  }
}

// ─── Lead CRUD ────────────────────────────────────────────────────────────────

export async function createLeadAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = createLeadSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const lead = await leadService.createLead(parsed.data, session.user.id)
    const meta = await getRequestMeta()
    await writeAuditLog({
      userId: session.user.id,
      action: "create",
      resource: "crm_leads",
      resourceId: lead.id,
      metadata: { title: lead.title },
      ...meta,
    })

    revalidatePath("/dashboard/leads")
    return { success: true, data: { id: lead.id } }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Tạo lead thất bại" }
  }
}

export async function updateLeadAction(
  id: string,
  _prevState: ActionResult<void>,
  formData: FormData
): Promise<ActionResult<void>> {
  await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = updateLeadSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    await leadService.updateLead(id, parsed.data)
    revalidatePath(`/dashboard/leads/${id}`)
    revalidatePath("/dashboard/leads")
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Cập nhật lead thất bại" }
  }
}

export async function deleteLeadAction(id: string): Promise<ActionResult<void>> {
  const session = await requireSession()

  try {
    await leadService.deleteLead(id)
    const meta = await getRequestMeta()
    await writeAuditLog({
      userId: session.user.id,
      action: "delete",
      resource: "crm_leads",
      resourceId: id,
      ...meta,
    })

    revalidatePath("/dashboard/leads")
    redirect("/dashboard/leads")
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Xóa lead thất bại" }
  }
}

// ─── Lead Notes ───────────────────────────────────────────────────────────────

export async function addLeadNoteAction(
  leadId: string,
  _prevState: ActionResult<void>,
  formData: FormData
): Promise<ActionResult<void>> {
  const session = await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = createNoteSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "Nội dung không hợp lệ",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    await leadService.addNote(leadId, parsed.data.content, session.user.id)
    revalidatePath(`/dashboard/leads/${leadId}`)
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Thêm ghi chú thất bại" }
  }
}

export async function deleteLeadNoteAction(
  noteId: string,
  leadId: string
): Promise<ActionResult<void>> {
  const session = await requireSession()

  try {
    await leadService.deleteNote(noteId, session.user.id)
    revalidatePath(`/dashboard/leads/${leadId}`)
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Xóa ghi chú thất bại" }
  }
}

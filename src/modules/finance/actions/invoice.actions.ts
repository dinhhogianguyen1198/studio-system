"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  sendInvoiceSchema,
  cancelInvoiceSchema,
} from "../schemas/finance.schema"
import { invoiceService } from "../service/invoice.service"

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Không tìm thấy hóa đơn",
  CANNOT_EDIT_FINALIZED_INVOICE: "Không thể sửa hóa đơn đã thanh toán hoặc đã hủy",
  INVOICE_NOT_DRAFT: "Hóa đơn không ở trạng thái nháp",
  CANNOT_CANCEL_PAID_INVOICE: "Không thể hủy hóa đơn đã thanh toán",
  CANNOT_DELETE_PAID_INVOICE: "Không thể xóa hóa đơn đã thanh toán",
}

export async function createInvoiceAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("finance_invoices", "create")

  const raw = Object.fromEntries(formData)

  // items được gửi dưới dạng JSON string
  let itemsRaw: unknown = raw.items
  try {
    itemsRaw = JSON.parse(raw.items as string)
  } catch {
    return { success: false, error: "Dữ liệu dịch vụ không hợp lệ" }
  }

  const parsed = createInvoiceSchema.safeParse({ ...raw, items: itemsRaw })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const invoice = await invoiceService.create(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "finance_invoices",
      resourceId: invoice.id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount.toString(),
      },
    })
    revalidatePath("/dashboard/finance/invoices")
    return { success: true, data: { id: invoice.id } }
  } catch (err) {
    return { success: false, error: toActionError(err, "Tạo hóa đơn thất bại") }
  }
}

export async function updateInvoiceAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_invoices", "update")

  const raw = Object.fromEntries(formData)
  let itemsRaw: unknown = raw.items
  if (raw.items) {
    try {
      itemsRaw = JSON.parse(raw.items as string)
    } catch {
      return { success: false, error: "Dữ liệu dịch vụ không hợp lệ" }
    }
  }

  const parsed = updateInvoiceSchema.safeParse({ ...raw, items: raw.items ? itemsRaw : undefined })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const invoice = await invoiceService.update(parsed.data)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_invoices",
      resourceId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber },
    })
    revalidatePath("/dashboard/finance/invoices")
    revalidatePath(`/dashboard/finance/invoices/${invoice.id}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật thất bại") }
  }
}

export async function sendInvoiceAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_invoices", "update")

  const raw = Object.fromEntries(formData)
  const parsed = sendInvoiceSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const invoice = await invoiceService.send(parsed.data.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_invoices",
      resourceId: invoice.id,
      metadata: { action: "SENT", invoiceNumber: invoice.invoiceNumber },
    })
    revalidatePath("/dashboard/finance/invoices")
    revalidatePath(`/dashboard/finance/invoices/${invoice.id}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Gửi hóa đơn thất bại") }
  }
}

export async function cancelInvoiceAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_invoices", "update")

  const raw = Object.fromEntries(formData)
  const parsed = cancelInvoiceSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const invoice = await invoiceService.cancel(parsed.data.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_invoices",
      resourceId: invoice.id,
      metadata: { action: "CANCELLED" },
    })
    revalidatePath("/dashboard/finance/invoices")
    revalidatePath(`/dashboard/finance/invoices/${invoice.id}`)
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Hủy hóa đơn thất bại") }
  }
}

export async function deleteInvoiceAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_invoices", "delete")

  const id = formData.get("id") as string
  if (!id) return { success: false, error: "ID không hợp lệ" }

  try {
    await invoiceService.delete(id)
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "finance_invoices",
      resourceId: id,
    })
    revalidatePath("/dashboard/finance/invoices")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Xóa thất bại") }
  }
}

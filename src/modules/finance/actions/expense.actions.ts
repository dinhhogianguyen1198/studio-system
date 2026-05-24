"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import { toActionError } from "@/shared/lib/action-error"
import type { ActionResult } from "@/shared/types/api.types"
import {
  createExpenseSchema,
  updateExpenseSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
  markExpensePaidSchema,
  createExpenseCategorySchema,
} from "../schemas/finance.schema"
import { expenseService } from "../service/expense.service"

export async function createExpenseAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_expenses", "create")

  const raw = Object.fromEntries(formData)
  const parsed = createExpenseSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const expense = await expenseService.create(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "finance_expenses",
      resourceId: expense.id,
      metadata: { title: expense.title, amount: expense.amount.toString() },
    })
    revalidatePath("/dashboard/finance/expenses")
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Tạo chi phí thất bại") }
  }
}

export async function updateExpenseAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_expenses", "update")

  const raw = Object.fromEntries(formData)
  const parsed = updateExpenseSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  const ERROR_MESSAGES: Record<string, string> = {
    NOT_FOUND: "Không tìm thấy chi phí",
    CANNOT_EDIT_FINALIZED_EXPENSE: "Không thể sửa chi phí đã thanh toán hoặc đã hủy",
  }

  try {
    const expense = await expenseService.update(parsed.data, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_expenses",
      resourceId: expense.id,
      metadata: { title: expense.title },
    })
    revalidatePath("/dashboard/finance/expenses")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Cập nhật thất bại") }
  }
}

export async function approveExpenseAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_expenses", "approve")

  const raw = Object.fromEntries(formData)
  const parsed = approveExpenseSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  const ERROR_MESSAGES: Record<string, string> = {
    NOT_FOUND: "Không tìm thấy chi phí",
    EXPENSE_NOT_PENDING: "Chi phí không ở trạng thái chờ duyệt",
  }

  try {
    const expense = await expenseService.approve(parsed.data.id, session.user.id)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_expenses",
      resourceId: expense.id,
      metadata: { action: "APPROVED" },
    })
    revalidatePath("/dashboard/finance/expenses")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Duyệt thất bại") }
  }
}

export async function rejectExpenseAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_expenses", "approve")

  const raw = Object.fromEntries(formData)
  const parsed = rejectExpenseSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  const ERROR_MESSAGES: Record<string, string> = {
    NOT_FOUND: "Không tìm thấy chi phí",
    EXPENSE_NOT_PENDING: "Chi phí không ở trạng thái chờ duyệt",
  }

  try {
    const expense = await expenseService.reject(parsed.data.id, parsed.data.reason)
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_expenses",
      resourceId: expense.id,
      metadata: { action: "REJECTED", reason: parsed.data.reason },
    })
    revalidatePath("/dashboard/finance/expenses")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Từ chối thất bại") }
  }
}

export async function markExpensePaidAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_expenses", "update")

  const raw = Object.fromEntries(formData)
  const parsed = markExpensePaidSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  const ERROR_MESSAGES: Record<string, string> = {
    NOT_FOUND: "Không tìm thấy chi phí",
    EXPENSE_NOT_APPROVED: "Chi phí chưa được duyệt",
  }

  try {
    const expense = await expenseService.markPaid(
      parsed.data.id,
      parsed.data.paymentMethod,
      parsed.data.reference,
    )
    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "finance_expenses",
      resourceId: expense.id,
      metadata: { action: "MARKED_PAID", method: parsed.data.paymentMethod },
    })
    revalidatePath("/dashboard/finance/expenses")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Đánh dấu thất bại") }
  }
}

export async function deleteExpenseAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_expenses", "delete")

  const id = formData.get("id") as string
  if (!id) return { success: false, error: "ID không hợp lệ" }

  const ERROR_MESSAGES: Record<string, string> = {
    NOT_FOUND: "Không tìm thấy chi phí",
    CANNOT_DELETE_PAID_EXPENSE: "Không thể xóa chi phí đã thanh toán",
  }

  try {
    await expenseService.delete(id)
    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "finance_expenses",
      resourceId: id,
    })
    revalidatePath("/dashboard/finance/expenses")
    return { success: true, data: undefined }
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN"
    return { success: false, error: ERROR_MESSAGES[code] ?? toActionError(err, "Xóa thất bại") }
  }
}

export async function createExpenseCategoryAction(
  _prevState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const session = await requirePermission("finance_expenses", "create")

  const raw = Object.fromEntries(formData)
  const parsed = createExpenseCategorySchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }

  try {
    const category = await expenseService.listCategories()
    void category
    const { expenseRepository } = await import("../repository/expense.repository")
    const created = await expenseRepository.createCategory({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      color: parsed.data.color,
      sortOrder: parsed.data.sortOrder,
      ...(parsed.data.parentId && { parent: { connect: { id: parsed.data.parentId } } }),
    })
    await writeAuditLog({
      userId: session.user.id,
      action: "CREATE",
      resource: "finance_expenses",
      resourceId: created.id,
      metadata: { type: "CATEGORY", name: created.name },
    })
    revalidatePath("/dashboard/finance/expenses")
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: toActionError(err, "Tạo danh mục thất bại") }
  }
}

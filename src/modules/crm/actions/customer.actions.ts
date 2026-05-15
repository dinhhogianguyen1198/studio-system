"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { customerService } from "../service/customer.service"
import {
  createCustomerSchema,
  updateCustomerSchema,
  createNoteSchema,
} from "../schemas/crm.schema"
import { requireSession } from "@/shared/lib/auth-utils"
import { writeAuditLog } from "@/shared/lib/audit"
import type { ActionResult } from "@/shared/types/api.types"
import type { CustomerStatus, CustomerSource } from "../types/crm.types"
import { orderService } from "@/modules/orders/service/order.service"

// ─── Serialized types for client components ────────────────────────────────────

export type SerializedNoteRow = {
  id: string
  content: string
  author: { id: string; name: string | null; email: string }
  createdAt: string
  updatedAt: string
}

export type CustomerDetailData = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  status: CustomerStatus
  source: CustomerSource
  tags: string[]
  _count: { leads: number; notes: number }
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string | null; email: string }
  notes: SerializedNoteRow[]
}

export type CustomerOrderItem = {
  id: string
  orderNumber: string
  status: string
  contactName: string
  totalAmount: number
  paidAmount: number
  currency: string
  createdAt: string
  _count: { items: number }
}

// ─── Quick Customer Creation (for inline use in order/booking forms) ──────────

export async function createCustomerQuickAction(
  _prevState: ActionResult<{ id: string; name: string; phone: string | null }>,
  formData: FormData,
): Promise<ActionResult<{ id: string; name: string; phone: string | null }>> {
  const session = await requireSession()
  const parsed = createCustomerSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }
  }

  try {
    const customer = await customerService.createCustomer(parsed.data, session.user.id)
    revalidatePath("/dashboard/customers")
    return { success: true, data: { id: customer.id, name: customer.name, phone: customer.phone } }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Tạo khách hàng thất bại" }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getRequestMeta() {
  const h = await headers()
  return {
    ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  }
}

// ─── Customer CRUD ────────────────────────────────────────────────────────────

export async function createCustomerAction(
  _prevState: ActionResult<{ id: string }>,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = createCustomerSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const customer = await customerService.createCustomer(parsed.data, session.user.id)
    const meta = await getRequestMeta()
    await writeAuditLog({
      userId: session.user.id,
      action: "create",
      resource: "crm_customers",
      resourceId: customer.id,
      metadata: { name: customer.name },
      ...meta,
    })

    revalidatePath("/dashboard/customers")
    return { success: true, data: { id: customer.id } }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Tạo khách hàng thất bại" }
  }
}

export async function updateCustomerAction(
  id: string,
  _prevState: ActionResult<void>,
  formData: FormData
): Promise<ActionResult<void>> {
  await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = updateCustomerSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    await customerService.updateCustomer(id, parsed.data)
    revalidatePath(`/dashboard/customers/${id}`)
    revalidatePath("/dashboard/customers")
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Cập nhật khách hàng thất bại" }
  }
}

export async function deleteCustomerAction(id: string): Promise<ActionResult<void>> {
  const session = await requireSession()

  try {
    await customerService.deleteCustomer(id)
    const meta = await getRequestMeta()
    await writeAuditLog({
      userId: session.user.id,
      action: "delete",
      resource: "crm_customers",
      resourceId: id,
      ...meta,
    })

    revalidatePath("/dashboard/customers")
    redirect("/dashboard/customers")
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Xóa khách hàng thất bại" }
  }
}

// ─── Customer Notes ───────────────────────────────────────────────────────────

export async function addCustomerNoteAction(
  customerId: string,
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
    await customerService.addNote(customerId, parsed.data.content, session.user.id)
    revalidatePath(`/dashboard/customers/${customerId}`)
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Thêm ghi chú thất bại" }
  }
}

// ─── Read actions ─────────────────────────────────────────────────────────────

export async function getCustomerDetailAction(id: string): Promise<ActionResult<CustomerDetailData>> {
  await requireSession()
  try {
    const customer = await customerService.getCustomer(id)
    return {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        address: customer.address,
        status: customer.status,
        source: customer.source,
        tags: customer.tags,
        _count: {
          leads: customer.leads.length,
          notes: customer.notes.length,
        },
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        createdBy: customer.createdBy,
        notes: customer.notes.map((n) => ({
          id: n.id,
          content: n.content,
          author: n.author,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
        })),
      },
    }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Không tìm thấy khách hàng" }
  }
}

export async function getCustomerOrdersAction(customerId: string): Promise<ActionResult<CustomerOrderItem[]>> {
  await requireSession()
  try {
    const { data } = await orderService.findMany({ customerId, page: 1, pageSize: 50 })
    return {
      success: true,
      data: data.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        contactName: o.contactName,
        totalAmount: Number(o.totalAmount),
        paidAmount: Number(o.paidAmount),
        currency: o.currency,
        createdAt: o.createdAt.toISOString(),
        _count: o._count,
      })),
    }
  } catch {
    return { success: false, error: "Không thể tải danh sách đơn hàng" }
  }
}

export async function deleteCustomerDialogAction(id: string): Promise<ActionResult<void>> {
  const session = await requireSession()
  try {
    await customerService.deleteCustomer(id)
    const meta = await getRequestMeta()
    await writeAuditLog({
      userId: session.user.id,
      action: "delete",
      resource: "crm_customers",
      resourceId: id,
      ...meta,
    })
    revalidatePath("/dashboard/customers")
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Xóa khách hàng thất bại" }
  }
}

// ─── Customer Notes ───────────────────────────────────────────────────────────

export async function deleteCustomerNoteAction(
  noteId: string,
  customerId: string
): Promise<ActionResult<void>> {
  const session = await requireSession()

  try {
    await customerService.deleteNote(noteId, session.user.id)
    revalidatePath(`/dashboard/customers/${customerId}`)
    return { success: true, data: undefined }
  } catch (err: unknown) {
    const crmErr = err as { message?: string }
    return { success: false, error: crmErr.message ?? "Xóa ghi chú thất bại" }
  }
}

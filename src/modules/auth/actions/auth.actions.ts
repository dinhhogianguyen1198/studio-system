"use server"

import { signIn, signOut } from "@/lib/auth"
import { AuthError } from "next-auth"
import { authService } from "../service/auth.service"
import { loginSchema, registerSchema, changePasswordSchema } from "../schemas/auth.schema"
import { writeAuditLog } from "@/shared/lib/audit"
import { requireSession } from "@/shared/lib/auth-utils"
import { headers } from "next/headers"
import type { ActionResult } from "@/shared/types/api.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getRequestMeta() {
  const h = await headers()
  return {
    ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Dùng với useActionState — signature (prevState, formData).
 */
export async function loginAction(
  _prevState: ActionResult<void>,
  formData: FormData
): Promise<ActionResult<void>> {
  const raw = Object.fromEntries(formData)
  const parsed = loginSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const meta = await getRequestMeta()

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      await writeAuditLog({
        action: "login_failed",
        resource: "auth",
        metadata: { email: parsed.data.email },
        ...meta,
      })
      return {
        success: false,
        error: "Email hoặc mật khẩu không đúng",
      }
    }
    // Re-throw NEXT_REDIRECT và các lỗi nội bộ khác — không được catch ở đây
    throw error
  }

  await writeAuditLog({
    action: "login",
    resource: "auth",
    metadata: { email: parsed.data.email },
    ...meta,
  })

  return { success: true, data: undefined }
}

export async function registerAction(
  _prevState: ActionResult<void>,
  formData: FormData
): Promise<ActionResult<void>> {
  const raw = Object.fromEntries(formData)
  const parsed = registerSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    await authService.registerUser({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    })

    const meta = await getRequestMeta()
    await writeAuditLog({
      action: "register",
      resource: "auth",
      metadata: { email: parsed.data.email },
      ...meta,
    })

    return { success: true, data: undefined }
  } catch (err: unknown) {
    const authErr = err as { message?: string }
    return {
      success: false,
      error: authErr.message ?? "Đăng ký thất bại. Vui lòng thử lại",
    }
  }
}

export async function changePasswordAction(
  _prevState: ActionResult<void>,
  formData: FormData
): Promise<ActionResult<void>> {
  const session = await requireSession()

  const raw = Object.fromEntries(formData)
  const parsed = changePasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    await authService.changePassword(
      session.user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    )

    await writeAuditLog({
      userId: session.user.id,
      action: "change_password",
      resource: "auth",
    })

    return { success: true, data: undefined }
  } catch (err: unknown) {
    const authErr = err as { message?: string }
    return {
      success: false,
      error: authErr.message ?? "Đổi mật khẩu thất bại",
    }
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" })
}

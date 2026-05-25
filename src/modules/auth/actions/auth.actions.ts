"use server"

import { encode } from "@auth/core/jwt"
import { signOut } from "@/lib/auth"
import { authService } from "../service/auth.service"
import { loginSchema, registerSchema, changePasswordSchema } from "../schemas/auth.schema"
import { writeAuditLog } from "@/shared/lib/audit"
import { requireSession } from "@/shared/lib/auth-utils"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { ActionResult } from "@/shared/types/api.types"

const SESSION_MAX_AGE = 8 * 60 * 60 // 8 giờ

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getRequestMeta() {
  const h = await headers()
  return {
    ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

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

  // Validate credentials trực tiếp — không dùng signIn() để tránh bug
  // next-auth 5.0.0-beta.31 + Next.js 16 gọi internal Server Action "x"
  let user
  try {
    user = await authService.validateCredentials(
      parsed.data.email,
      parsed.data.password
    )
  } catch {
    await writeAuditLog({
      action: "login_failed",
      resource: "auth",
      metadata: { email: parsed.data.email },
      ...meta,
    })
    return { success: false, error: "Email hoặc mật khẩu không đúng" }
  }

  // Tạo JWT token theo đúng format Auth.js đọc trong session callback
  const isSecure = process.env.AUTH_URL?.startsWith("https") ?? false
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

  const sessionToken = await encode({
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      picture: user.image ?? undefined,
      id: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: user.role.permissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`
      ),
    },
    secret: process.env.AUTH_SECRET!,
    maxAge: SESSION_MAX_AGE,
    salt: cookieName,
  })

  const cookieStore = await cookies()
  cookieStore.set({
    name: cookieName,
    value: sessionToken,
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })

  await writeAuditLog({
    action: "login",
    resource: "auth",
    metadata: { email: parsed.data.email },
    ...meta,
  })

  // redirect() phải gọi ngoài try-catch để NEXT_REDIRECT propagate đúng
  redirect("/dashboard")
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

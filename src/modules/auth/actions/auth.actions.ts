"use server"

import { encode } from "@auth/core/jwt"
import { signOut } from "@/lib/auth"
import { authService } from "../service/auth.service"
import { loginSchema, changePasswordSchema } from "../schemas/auth.schema"
import { writeAuditLog } from "@/shared/lib/audit"
import { requireSession } from "@/shared/lib/auth-utils"
import { checkRateLimit } from "@/shared/lib/rate-limit"
import { env } from "@/config/env"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { ActionResult } from "@/shared/types/api.types"

const SESSION_MAX_AGE = 8 * 60 * 60 // 8 giờ
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60 // 30 ngày

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
  const rememberMe = formData.get("rememberMe") === "on"
  const maxAge = rememberMe ? REMEMBER_ME_MAX_AGE : SESSION_MAX_AGE

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
  const ip = meta.ipAddress ?? "unknown"

  // Rate limit: 10 lần / 15 phút / IP để chống brute-force
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.allowed) {
    return {
      success: false,
      error: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau vài phút.",
    }
  }

  let user
  try {
    user = await authService.validateCredentials(
      parsed.data.email,
      parsed.data.password
    )
  } catch {
    await writeAuditLog({
      action: "LOGIN_FAILED",
      resource: "auth",
      metadata: { email: parsed.data.email },
      ...meta,
    })
    return { success: false, error: "Email hoặc mật khẩu không đúng" }
  }

  // Tạo JWT token theo đúng format Auth.js đọc trong session callback
  const isSecure = env.AUTH_URL.startsWith("https")
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
      // permissions không lưu trong JWT — fetch từ DB trong session callback
    },
    secret: env.AUTH_SECRET,
    maxAge: maxAge,
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
    maxAge: maxAge,
  })

  await writeAuditLog({
    action: "LOGIN",
    resource: "auth",
    metadata: { email: parsed.data.email },
    ...meta,
  })

  // redirect() phải gọi ngoài try-catch để NEXT_REDIRECT propagate đúng
  redirect("/dashboard")
}

export async function registerAction(
  _prevState: ActionResult<void>,
  _formData: FormData
): Promise<ActionResult<void>> {
  return {
    success: false,
    error: "Tự đăng ký tài khoản không được phép. Vui lòng liên hệ quản trị viên.",
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
      action: "CHANGE_PASSWORD",
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

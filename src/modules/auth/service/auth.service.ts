import { authRepository } from "../repository/auth.repository"
import { verifyPassword, hashPassword } from "@/shared/lib/password"
import type { AuthError, RegisterResult } from "../types/auth.types"

export const authService = {
  /**
   * Xác thực thông tin đăng nhập.
   * Throw AuthError nếu không hợp lệ — KHÔNG tiết lộ email tồn tại hay không.
   */
  async validateCredentials(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email)

    const isValid = user?.password
      ? await verifyPassword(password, user.password)
      : false

    if (!user || !isValid) {
      throw {
        code: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không đúng",
      } satisfies AuthError
    }

    return user
  },

  /**
   * Đăng ký tài khoản mới với role mặc định "user".
   * Throw AuthError nếu email đã tồn tại hoặc role không được cấu hình.
   */
  async registerUser(data: {
    email: string
    password: string
    name: string
  }): Promise<RegisterResult> {
    const existing = await authRepository.findUserByEmail(data.email)
    if (existing) {
      throw {
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email này đã được sử dụng",
      } satisfies AuthError
    }

    const defaultRole = await authRepository.findDefaultRole()
    if (!defaultRole) {
      throw {
        code: "ROLE_NOT_FOUND",
        message: "Cấu hình hệ thống lỗi: không tìm thấy role mặc định",
      } satisfies AuthError
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await authRepository.createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      roleId: defaultRole.id,
    })

    return { id: user.id, email: user.email, name: user.name }
  },

  /**
   * Đổi mật khẩu sau khi xác thực mật khẩu hiện tại.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await authRepository.findUserById(userId)

    if (!user?.password) {
      throw {
        code: "INVALID_CREDENTIALS",
        message: "Tài khoản không hỗ trợ đổi mật khẩu",
      } satisfies AuthError
    }

    const isValid = await verifyPassword(currentPassword, user.password)
    if (!isValid) {
      throw {
        code: "INVALID_CREDENTIALS",
        message: "Mật khẩu hiện tại không đúng",
      } satisfies AuthError
    }

    const hashed = await hashPassword(newPassword)
    await authRepository.updatePassword(userId, hashed)
  },
}

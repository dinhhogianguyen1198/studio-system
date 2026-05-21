import "server-only"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/shared/lib/prisma"
import { authService } from "@/modules/auth/service/auth.service"
import { loginSchema } from "@/modules/auth/schemas/auth.schema"
import { authConfig } from "./auth.config"
import type { RoleWithPermissions } from "@/shared/types/rbac.types"

// Đảm bảo session types được augment
import "@/shared/types/session.types"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        try {
          const user = await authService.validateCredentials(
            parsed.data.email,
            parsed.data.password
          )

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            roleId: user.roleId,
            role: user.role as RoleWithPermissions,
          }
        } catch {
          // Trả về null để Auth.js xử lý lỗi credentials
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      // Chỉ chạy lần đầu khi user đăng nhập
      if (user) {
        token.id = user.id as string
        const u = user as typeof user & { roleId: string; role: RoleWithPermissions }
        token.roleId = u.roleId
        token.roleName = u.role.name
        // Lưu dạng compact "resource:action" để tránh cookie quá lớn (HTTP 431)
        token.permissions = u.role.permissions.map(
          (rp) => `${rp.permission.resource}:${rp.permission.action}`
        )
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.roleId = token.roleId
        // Reconstruct RoleWithPermissions từ compact strings
        session.user.role = {
          id: token.roleId,
          name: token.roleName,
          permissions: token.permissions.map((p) => {
            const idx = p.indexOf(":")
            return {
              permission: {
                resource: p.slice(0, idx),
                action: p.slice(idx + 1),
              },
            }
          }),
        }
      }
      return session
    },
  },
})

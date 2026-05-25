import "server-only"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authService } from "@/modules/auth/service/auth.service"
import { loginSchema } from "@/modules/auth/schemas/auth.schema"
import { authConfig } from "./auth.config"
import { getCachedRole, emptyRole } from "@/shared/lib/permission-cache"
import type { RoleWithPermissions } from "@/shared/types/rbac.types"

// Đảm bảo session types được augment
import "@/shared/types/session.types"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        const u = user as typeof user & { roleId: string; role: RoleWithPermissions }
        token.roleId = u.roleId
        token.roleName = u.role.name
        // permissions không lưu trong JWT — fetch từ cache/DB trong session callback
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.roleId = token.roleId
        // Dùng unstable_cache (5 phút TTL) thay vì per-request cache()
        // Giảm DB query từ mỗi request xuống còn 1 lần / 5 phút / roleId
        session.user.role =
          (await getCachedRole(token.roleId)) ??
          emptyRole(token.roleId, token.roleName as string)
      }
      return session
    },
  },
})

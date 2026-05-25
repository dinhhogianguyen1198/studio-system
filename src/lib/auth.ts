import "server-only"
import { cache } from "react"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authService } from "@/modules/auth/service/auth.service"
import { loginSchema } from "@/modules/auth/schemas/auth.schema"
import { authConfig } from "./auth.config"
import { db } from "@/shared/lib/prisma"
import type { RoleWithPermissions } from "@/shared/types/rbac.types"

// Đảm bảo session types được augment
import "@/shared/types/session.types"

// Cache per request — dedup khi layout + page cùng gọi auth()
const getRoleWithPermissions = cache(async (roleId: string): Promise<RoleWithPermissions> => {
  return db.role.findUniqueOrThrow({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      permissions: {
        select: {
          permission: { select: { resource: true, action: true } },
        },
      },
    },
  }) as Promise<RoleWithPermissions>
})

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
          // Trả về null để Auth.js xử lý lỗi credentials
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
        // permissions không lưu trong JWT — fetch từ DB mỗi request để tránh cookie quá lớn
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.roleId = token.roleId
        session.user.role = await getRoleWithPermissions(token.roleId)
      }
      return session
    },
  },
})

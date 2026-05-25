import type { DefaultSession, DefaultUser } from "@auth/core/types"
import type { RoleWithPermissions } from "./rbac.types"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: SessionUser
  }

  interface User extends DefaultUser {
    roleId: string
    role: RoleWithPermissions
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    roleId: string
    roleName: string
  }
}

export interface SessionUser {
  id: string
  email: string
  name: string | null
  image: string | null
  roleId: string
  role: RoleWithPermissions
}

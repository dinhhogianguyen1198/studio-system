import { db } from "@/shared/lib/prisma"

// Include RBAC data vào mọi user query liên quan đến auth
const userWithRole = {
  include: {
    role: {
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    },
  },
} as const

export const authRepository = {
  async findUserByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
      ...userWithRole,
    })
  },

  async findUserById(id: string) {
    return db.user.findUnique({
      where: { id },
      ...userWithRole,
    })
  },

  async findDefaultRole() {
    return db.role.findUnique({
      where: { name: "user" },
    })
  },

  async createUser(data: {
    email: string
    password: string
    name: string
    roleId: string
  }) {
    return db.user.create({
      data,
      ...userWithRole,
    })
  },

  async updatePassword(userId: string, hashedPassword: string) {
    return db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })
  },
}

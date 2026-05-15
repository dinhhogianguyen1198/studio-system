import bcrypt from "bcryptjs"
import { db } from "../client"

export async function seedUsers() {
  console.log("Đang seed owner user...")

  const ownerRole = await db.role.findUnique({ where: { name: "owner" } })
  if (!ownerRole) {
    throw new Error("Chạy seedRoles() trước khi seedUsers()")
  }

  const hashedPassword = await bcrypt.hash("Admin123@", 12)

  const owner = await db.user.upsert({
    where: { email: "admin@example.com" },
    update: { password: hashedPassword, roleId: ownerRole.id },
    create: {
      email: "admin@example.com",
      name: "Admin",
      password: hashedPassword,
      roleId: ownerRole.id,
    },
  })

  console.log(`  ✓ Owner user: ${owner.email}`)
}

import bcrypt from "bcryptjs"
import { db } from "../client"

export async function seedUsers() {
  console.log("Đang seed owner user...")

  const ownerRole = await db.role.findUnique({ where: { name: "owner" } })
  if (!ownerRole) {
    throw new Error("Chạy seedRoles() trước khi seedUsers()")
  }

  const password = process.env.SEED_ADMIN_PASSWORD
  const email = process.env.SEED_ADMIN_EMAIL
  if (!email || !password || password.length < 12) {
    throw new Error("Cần SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD (ít nhất 12 ký tự).")
  }
  const hashedPassword = await bcrypt.hash(password, 12)

  const owner = await db.user.upsert({
    where: { email: email },
    update: { password: hashedPassword, roleId: ownerRole.id },
    create: {
      email: email,
      name: "Admin",
      password: hashedPassword,
      roleId: ownerRole.id,
    },
  })

  console.log(`  ✓ Owner user: ${owner.email}`)
}

import { db } from "../client"
import { seedRoles } from "./roles.seed"
import { seedUsers } from "./users.seed"

async function main() {
  console.log("Bắt đầu seed database...\n")

  await seedRoles()
  await seedUsers()

  console.log("\nSeed hoàn thành.")
}

main()
  .catch((err) => {
    console.error("Seed thất bại:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

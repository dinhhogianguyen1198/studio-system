import { db } from "../client"
import { seedRoles } from "./roles.seed"
import { seedUsers } from "./users.seed"
import { seedFinance } from "./finance.seed"

async function main() {
  console.log("Bắt đầu seed database...\n")

  await seedRoles()
  await seedUsers()
  await seedFinance()

  console.log("\nSeed hoàn thành.")
}

main()
  .catch((err) => {
    console.error("Seed thất bại:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

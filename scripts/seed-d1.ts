import "dotenv/config"
import { getPlatformProxy } from "wrangler"
import { PrismaD1 } from "@prisma/adapter-d1"
import { Prisma, PrismaClient } from "@prisma/client"
import type { D1Database } from "@cloudflare/workers-types"
import type {} from "../prisma/client"

async function main() {
  if (
    !process.env.SEED_ADMIN_EMAIL ||
    !process.env.SEED_ADMIN_PASSWORD ||
    process.env.SEED_ADMIN_PASSWORD.length < 12
  ) {
    throw new Error(
      "Cần SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD (ít nhất 12 ký tự).",
    )
  }
  const remote = process.argv.includes("--remote")
  let dispose: (() => Promise<void>) | undefined
  let adapter: NonNullable<Prisma.PrismaClientOptions["adapter"]>
  if (remote) {
    const {
      CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_DATABASE_ID,
    } = process.env
    if (
      !CLOUDFLARE_API_TOKEN ||
      !CLOUDFLARE_ACCOUNT_ID ||
      !CLOUDFLARE_DATABASE_ID
    ) {
      throw new Error(
        "Remote seed cần CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID và CLOUDFLARE_DATABASE_ID.",
      )
    }
    adapter = new PrismaD1({
      CLOUDFLARE_D1_TOKEN: CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_DATABASE_ID,
    })
  } else {
    const platform = await getPlatformProxy<{ DB: D1Database }>()
    adapter = new PrismaD1(platform.env.DB)
    dispose = () => platform.dispose()
  }
  const client = new PrismaClient({ adapter })
  globalThis.studioSeedClient = client
  try {
    const { seedRoles } = await import("../prisma/seeds/roles.seed")
    const { seedUsers } = await import("../prisma/seeds/users.seed")
    const { seedFinance } = await import("../prisma/seeds/finance.seed")
    await seedRoles()
    await seedUsers()
    await seedFinance()
  } finally {
    globalThis.studioSeedClient = undefined
    await client.$disconnect()
    await dispose?.()
  }
}
main().catch((error) => {
  // Avoid dumping connection errors containing API request headers or tokens.
  console.error(error instanceof Error ? error.message : "D1 seed thất bại")
  process.exitCode = 1
})

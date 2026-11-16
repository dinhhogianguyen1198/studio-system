import type { PrismaClient } from "@prisma/client"

declare global {
  var studioSeedClient: PrismaClient | undefined
}

if (!globalThis.studioSeedClient) {
  throw new Error("Chạy seed bằng npm run seed hoặc npm run seed:remote.")
}
export const db = globalThis.studioSeedClient

import "server-only"
import { PrismaD1 } from "@prisma/adapter-d1"
import { PrismaClient } from "@prisma/client/edge"
import { getD1 } from "./d1"
import { getCloudflareContext } from "@opennextjs/cloudflare"

// Resolve bindings during a request, not while Next.js collects build metadata.
// Cache only within the current request, never across D1 request contexts.
const clients = new WeakMap<object, PrismaClient>()
function getClient() {
  const key = globalThis.studioD1 ?? getCloudflareContext().ctx
  let client = clients.get(key)
  if (!client) {
    // Next dev runs in Node; this branch is eliminated from production builds.
    let Client = PrismaClient
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Client = (require("@prisma/client") as typeof import("@prisma/client")).PrismaClient
    }
    client = new Client({ adapter: new PrismaD1(getD1()) })
    clients.set(key, client)
  }
  return client
}
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    if (property === "$transaction") {
      throw new Error("D1 không hỗ trợ Prisma transactions. Dùng atomicBatch.")
    }
    const client = getClient()
    const value = Reflect.get(client, property, client)
    return typeof value === "function" ? value.bind(client) : value
  },
})

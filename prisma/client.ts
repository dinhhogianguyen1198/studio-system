/**
 * Standalone Prisma client dành riêng cho scripts/seeds.
 * KHÔNG import "server-only" — chạy được bằng tsx ngoài Next.js.
 */
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"
import path from "path"

// Load .env từ thư mục app/
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL chưa được cấu hình trong .env")
}

const adapter = new PrismaPg({ connectionString })

export const db = new PrismaClient({ adapter })

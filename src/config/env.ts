import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL phải là URL hợp lệ"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET phải ít nhất 32 ký tự"),
  AUTH_URL: z.string().url("AUTH_URL phải là URL hợp lệ"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    "❌ Biến môi trường không hợp lệ:",
    parsed.error.flatten().fieldErrors
  )
  throw new Error("Cấu hình môi trường không hợp lệ. Kiểm tra file .env")
}

export const env = parsed.data

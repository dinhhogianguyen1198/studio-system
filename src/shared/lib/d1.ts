import { getCloudflareContext } from "@opennextjs/cloudflare"
import type { D1Database } from "@cloudflare/workers-types"

declare global {
  // Populated by standalone seed/integration scripts, never by HTTP input.
  var studioD1: D1Database | undefined
  interface CloudflareEnv {
    DB: D1Database
  }
}

export function getD1(): D1Database {
  const binding = globalThis.studioD1 ?? getCloudflareContext().env.DB
  if (!binding)
    throw new Error("Thiếu D1 binding DB. Cấu hình DB trong wrangler.jsonc.")
  return binding as D1Database
}

export type BatchStatement = { sql: string; values?: unknown[] }

function parameter(value: unknown): string | number | null {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString().replace("Z", "+00:00")
  if (typeof value === "boolean") return value ? 1 : 0
  if (typeof value === "number" || typeof value === "string") return value
  return String(value)
}

// D1 batch rolls back every statement if any statement fails.
// Prisma's D1 adapter cannot provide this guarantee for $transaction.
export async function atomicBatch(statements: BatchStatement[]) {
  if (!statements.length) return []
  const database = getD1()
  return database.batch(
    statements.map(({ sql, values = [] }) =>
      database.prepare(sql).bind(...values.map(parameter)),
    ),
  )
}

export function createId() {
  return `c${crypto.randomUUID().replaceAll("-", "")}`
}

function identifier(name: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
    throw new Error("Invalid SQL identifier")
  return `"${name}"`
}

export function insertRow(
  table: string,
  row: Record<string, unknown>,
): BatchStatement {
  const entries = Object.entries(row).filter(([, value]) => value !== undefined)
  return {
    sql: `INSERT INTO ${identifier(table)} (${entries.map(([key]) => identifier(key)).join(",")}) VALUES (${entries.map(() => "?").join(",")})`,
    values: entries.map(([, value]) => value),
  }
}

export function updateRow(
  table: string,
  id: string,
  row: Record<string, unknown>,
): BatchStatement {
  const entries = Object.entries(row).filter(([, value]) => value !== undefined)
  return {
    sql: `UPDATE ${identifier(table)} SET ${entries.map(([key]) => `${identifier(key)} = ?`).join(",")} WHERE id = ?`,
    values: [...entries.map(([, value]) => value), id],
  }
}

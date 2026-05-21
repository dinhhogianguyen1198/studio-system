/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-process VPS deployments.
 * Replace with Redis-backed limiter (e.g. @upstash/ratelimit) for multi-instance.
 */

interface RateEntry {
  count: number
  resetAt: number
}

// Module-level store — persists across requests in the same process
const store = new Map<string, RateEntry>()
let lastCleanup = Date.now()

function cleanup(): void {
  if (Date.now() - lastCleanup < 60_000) return
  lastCleanup = Date.now()
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check (and increment) rate limit for a given key.
 *
 * @param key      Unique key per subject (e.g. "login:127.0.0.1")
 * @param limit    Max allowed requests in the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

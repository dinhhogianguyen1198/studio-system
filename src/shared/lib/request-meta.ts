import "server-only"
import { headers } from "next/headers"

export interface RequestMeta {
  ipAddress: string | undefined
  userAgent: string | undefined
}

/**
 * Extract IP and User-Agent from current request headers.
 * Call once per Server Action to get consistent metadata.
 */
export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers()
  return {
    ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  }
}

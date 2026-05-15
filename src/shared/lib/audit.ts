import "server-only"
import { Prisma } from "@prisma/client"
import { db } from "@/shared/lib/prisma"

interface AuditLogData {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Ghi audit log. Không bao giờ throw — lỗi chỉ được log ra console
 * để tránh crash luồng nghiệp vụ chính.
 */
export async function writeAuditLog(data: AuditLogData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        metadata: data.metadata != null ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    })
  } catch (err) {
    console.error("[AuditLog] Ghi thất bại:", data, err)
  }
}

import type { Prisma } from "@prisma/client"

// ─── Select fragments ──────────────────────────────────────────────────────────

export const orderManagementUnitSummarySelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  sortOrder: true,
} satisfies Prisma.OrderManagementUnitSelect

// ─── Inferred types ────────────────────────────────────────────────────────────

export type OrderManagementUnitSummary = Prisma.OrderManagementUnitGetPayload<{
  select: typeof orderManagementUnitSummarySelect
}>

// ─── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateOrderManagementUnitDto {
  name: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateOrderManagementUnitDto extends Partial<CreateOrderManagementUnitDto> {}

export interface OrderManagementUnitFilters {
  isActive?: boolean
  search?: string
  page: number
  pageSize: number
}

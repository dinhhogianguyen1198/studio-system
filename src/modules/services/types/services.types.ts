import type { Prisma } from "@prisma/client"

// ─── Select fragments ──────────────────────────────────────────────────────────

export const serviceDefinitionSummarySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  defaultPrice: true,
  currency: true,
  defaultDurationDays: true,
  isActive: true,
  sortOrder: true,
} satisfies Prisma.ServiceDefinitionSelect

export const serviceDefinitionDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  defaultPrice: true,
  currency: true,
  defaultDurationDays: true,
  defaultSlaHours: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ServiceDefinitionSelect

// ─── Inferred types ────────────────────────────────────────────────────────────

export type ServiceDefinitionSummary = Prisma.ServiceDefinitionGetPayload<{
  select: typeof serviceDefinitionSummarySelect
}>

export type ServiceDefinitionDetail = Prisma.ServiceDefinitionGetPayload<{
  select: typeof serviceDefinitionDetailSelect
}>

// ─── Serialized types (Decimal → number) for Client Components ────────────────

export type SerializedServiceDefinitionSummary = Omit<ServiceDefinitionSummary, "defaultPrice"> & {
  defaultPrice: number
}

export function serializeServiceDefinitionSummary(
  s: ServiceDefinitionSummary,
): SerializedServiceDefinitionSummary {
  return { ...s, defaultPrice: Number(s.defaultPrice) }
}

export type SerializedServiceDefinitionDetail = Omit<ServiceDefinitionDetail, "defaultPrice"> & {
  defaultPrice: number
}

export function serializeServiceDefinitionDetail(
  s: ServiceDefinitionDetail,
): SerializedServiceDefinitionDetail {
  return { ...s, defaultPrice: Number(s.defaultPrice) }
}

// ─── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateServiceDefinitionDto {
  name: string
  slug: string
  description?: string
  defaultPrice: number
  currency?: string
  defaultDurationDays?: number
  defaultSlaHours?: number
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateServiceDefinitionDto extends Partial<CreateServiceDefinitionDto> {}

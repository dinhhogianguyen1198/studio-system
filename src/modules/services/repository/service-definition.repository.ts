import { db } from "@/shared/lib/prisma"
import type { Prisma } from "@prisma/client"
import type {
  CreateServiceDefinitionDto,
  ServiceDefinitionDetail,
  ServiceDefinitionSummary,
  UpdateServiceDefinitionDto,
} from "../types/services.types"
import {
  serviceDefinitionDetailSelect,
  serviceDefinitionSummarySelect,
} from "../types/services.types"

export interface ServiceDefinitionFilters {
  isActive?: boolean
  search?: string
  page: number
  pageSize: number
}

export const serviceDefinitionRepository = {
  async findMany(
    filters: ServiceDefinitionFilters,
  ): Promise<{ data: ServiceDefinitionSummary[]; total: number }> {
    const { isActive, search, page, pageSize } = filters
    const where: Prisma.ServiceDefinitionWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    }
    const [data, total] = await Promise.all([
      db.serviceDefinition.findMany({
        where,
        select: serviceDefinitionSummarySelect,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.serviceDefinition.count({ where }),
    ])
    return { data, total }
  },

  async findAllActive(): Promise<ServiceDefinitionSummary[]> {
    return db.serviceDefinition.findMany({
      where: { isActive: true },
      select: serviceDefinitionSummarySelect,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })
  },

  async findById(id: string): Promise<ServiceDefinitionDetail | null> {
    return db.serviceDefinition.findUnique({
      where: { id },
      select: serviceDefinitionDetailSelect,
    })
  },

  async findBySlug(slug: string): Promise<{ id: string } | null> {
    return db.serviceDefinition.findUnique({
      where: { slug },
      select: { id: true },
    })
  },

  async create(
    data: CreateServiceDefinitionDto,
    createdById: string,
  ): Promise<ServiceDefinitionDetail> {
    const { defaultPrice, ...rest } = data
    return db.serviceDefinition.create({
      data: {
        ...rest,
        defaultPrice: new (await import("@prisma/client")).Prisma.Decimal(defaultPrice),
        createdById,
      },
      select: serviceDefinitionDetailSelect,
    })
  },

  async update(id: string, data: UpdateServiceDefinitionDto): Promise<ServiceDefinitionDetail> {
    const { defaultPrice, ...rest } = data
    return db.serviceDefinition.update({
      where: { id },
      data: {
        ...rest,
        ...(defaultPrice !== undefined && {
          defaultPrice: new (await import("@prisma/client")).Prisma.Decimal(defaultPrice),
        }),
      },
      select: serviceDefinitionDetailSelect,
    })
  },

  async delete(id: string): Promise<void> {
    await db.serviceDefinition.delete({ where: { id } })
  },
}

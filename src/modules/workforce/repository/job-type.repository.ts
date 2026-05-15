import { Prisma } from "@prisma/client"
import { db } from "@/shared/lib/prisma"
import type { PaginatedResponse } from "@/shared/types/api.types"
import {
  jobTypeSummarySelect,
  type JobTypeSummary,
  type JobTypeFilters,
  type CreateJobTypeDto,
  type UpdateJobTypeDto,
} from "@/modules/workforce/types/workforce.types"

export const jobTypeRepository = {
  async findMany(filters: JobTypeFilters): Promise<PaginatedResponse<JobTypeSummary>> {
    const { page, pageSize, search, isActive } = filters
    const where: Prisma.JobTypeWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    }

    const [data, total] = await Promise.all([
      db.jobType.findMany({
        where,
        select: jobTypeSummarySelect,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.jobType.count({ where }),
    ])

    return {
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  },

  async findAllActive(): Promise<JobTypeSummary[]> {
    return db.jobType.findMany({
      where: { isActive: true },
      select: jobTypeSummarySelect,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 200,
    })
  },

  async findById(id: string): Promise<JobTypeSummary | null> {
    return db.jobType.findUnique({
      where: { id },
      select: jobTypeSummarySelect,
    })
  },

  async create(data: CreateJobTypeDto, createdById: string): Promise<JobTypeSummary> {
    return db.jobType.create({
      data: { ...data, createdById },
      select: jobTypeSummarySelect,
    })
  },

  async update(data: UpdateJobTypeDto): Promise<JobTypeSummary> {
    const { id, ...updateData } = data
    return db.jobType.update({
      where: { id },
      data: updateData,
      select: jobTypeSummarySelect,
    })
  },

  async delete(id: string): Promise<void> {
    await db.jobType.delete({ where: { id } })
  },

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await db.jobType.count({
      where: { name: { equals: name, mode: "insensitive" }, ...(excludeId && { id: { not: excludeId } }) },
    })
    return count > 0
  },

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const count = await db.jobType.count({
      where: { slug, ...(excludeId && { id: { not: excludeId } }) },
    })
    return count > 0
  },

  async hasWorkers(id: string): Promise<boolean> {
    const count = await db.workerJobType.count({ where: { jobTypeId: id } })
    return count > 0
  },
}

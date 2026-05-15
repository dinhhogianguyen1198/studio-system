import { Prisma } from "@prisma/client"
import { db } from "@/shared/lib/prisma"
import type { PaginatedResponse } from "@/shared/types/api.types"
import {
  workerSummarySelect,
  workerDetailSelect,
  type WorkerSummary,
  type WorkerDetail,
  type WorkerFilters,
  type CreateWorkerDto,
  type UpdateWorkerDto,
} from "@/modules/workforce/types/workforce.types"

export const workerRepository = {
  async findMany(filters: WorkerFilters): Promise<PaginatedResponse<WorkerSummary>> {
    const { page, pageSize, search, isActive, jobTypeId } = filters
    const where: Prisma.WorkerWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
      ...(jobTypeId && { jobTypes: { some: { jobTypeId } } }),
    }

    const [data, total] = await Promise.all([
      db.worker.findMany({
        where,
        select: workerSummarySelect,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.worker.count({ where }),
    ])

    return {
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  },

  async findById(id: string): Promise<WorkerDetail | null> {
    return db.worker.findUnique({
      where: { id },
      select: workerDetailSelect,
    })
  },

  async findAllActive(): Promise<WorkerSummary[]> {
    return db.worker.findMany({
      where: { isActive: true },
      select: workerSummarySelect,
      orderBy: { name: "asc" },
      take: 500,
    })
  },

  async create(data: CreateWorkerDto, createdById: string): Promise<WorkerDetail> {
    const { jobTypeIds, primaryJobTypeId, ...workerData } = data

    return db.worker.create({
      data: {
        ...workerData,
        createdById,
        jobTypes: {
          create: jobTypeIds.map((jobTypeId) => ({
            jobTypeId,
            isPrimary: jobTypeId === primaryJobTypeId,
          })),
        },
      },
      select: workerDetailSelect,
    })
  },

  async update(data: UpdateWorkerDto): Promise<WorkerDetail> {
    const { id, jobTypeIds, primaryJobTypeId, ...workerData } = data

    return db.$transaction(async (tx) => {
      if (jobTypeIds !== undefined) {
        await tx.workerJobType.deleteMany({ where: { workerId: id } })
        if (jobTypeIds.length > 0) {
          await tx.workerJobType.createMany({
            data: jobTypeIds.map((jobTypeId) => ({
              workerId: id,
              jobTypeId,
              isPrimary: jobTypeId === primaryJobTypeId,
            })),
          })
        }
      }

      return tx.worker.update({
        where: { id },
        data: workerData,
        select: workerDetailSelect,
      })
    })
  },

  async delete(id: string): Promise<void> {
    await db.worker.delete({ where: { id } })
  },

  async existsById(id: string): Promise<boolean> {
    const count = await db.worker.count({ where: { id } })
    return count > 0
  },

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const count = await db.worker.count({
      where: { email, ...(excludeId && { id: { not: excludeId } }) },
    })
    return count > 0
  },
}

import { atomicBatch, insertRow, updateRow, createId } from "@/shared/lib/d1"
import { Prisma } from "@prisma/client/edge"
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
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
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

    const id = createId()
    const now = new Date()
    await atomicBatch([
      insertRow("workers", { id, ...workerData, createdById, createdAt: now, updatedAt: now }),
      ...jobTypeIds.map((jobTypeId) => insertRow("worker_job_types", {
        workerId: id, jobTypeId, isPrimary: jobTypeId === primaryJobTypeId,
      })),
    ])
    return db.worker.findUniqueOrThrow({ where: { id }, select: workerDetailSelect })
  },

  async update(data: UpdateWorkerDto): Promise<WorkerDetail> {
    const { id, jobTypeIds, primaryJobTypeId, ...workerData } = data

    await atomicBatch([
      ...(jobTypeIds === undefined ? [] : [
        { sql: 'DELETE FROM worker_job_types WHERE "workerId" = ?', values: [id] },
        ...jobTypeIds.map((jobTypeId) => insertRow("worker_job_types", {
          workerId: id, jobTypeId, isPrimary: jobTypeId === primaryJobTypeId,
        })),
      ]),
      updateRow("workers", id, { ...workerData, updatedAt: new Date() }),
    ])
    return db.worker.findUniqueOrThrow({ where: { id }, select: workerDetailSelect })
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

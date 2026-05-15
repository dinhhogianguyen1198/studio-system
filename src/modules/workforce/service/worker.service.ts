import { workerRepository } from "@/modules/workforce/repository/worker.repository"
import type {
  WorkerSummary,
  WorkerDetail,
  WorkerFilters,
  CreateWorkerDto,
  UpdateWorkerDto,
} from "@/modules/workforce/types/workforce.types"
import type { PaginatedResponse } from "@/shared/types/api.types"

export const workerService = {
  async getWorkers(filters: WorkerFilters): Promise<PaginatedResponse<WorkerSummary>> {
    return workerRepository.findMany(filters)
  },

  async getWorkerById(id: string): Promise<WorkerDetail> {
    const worker = await workerRepository.findById(id)
    if (!worker) throw new Error("WORKER_NOT_FOUND")
    return worker
  },

  async getAllActiveWorkers(): Promise<WorkerSummary[]> {
    return workerRepository.findAllActive()
  },

  async createWorker(data: CreateWorkerDto, createdById: string): Promise<WorkerDetail> {
    if (data.email) {
      const emailExists = await workerRepository.existsByEmail(data.email)
      if (emailExists) throw new Error("DUPLICATE_WORKER_EMAIL")
    }
    return workerRepository.create(data, createdById)
  },

  async updateWorker(data: UpdateWorkerDto, updatedById: string): Promise<WorkerDetail> {
    const existing = await workerRepository.findById(data.id)
    if (!existing) throw new Error("WORKER_NOT_FOUND")

    if (data.email && data.email !== existing.email) {
      const emailExists = await workerRepository.existsByEmail(data.email, data.id)
      if (emailExists) throw new Error("DUPLICATE_WORKER_EMAIL")
    }

    return workerRepository.update(data)
  },

  async deleteWorker(id: string): Promise<void> {
    const exists = await workerRepository.existsById(id)
    if (!exists) throw new Error("WORKER_NOT_FOUND")
    await workerRepository.delete(id)
  },
}

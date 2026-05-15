import { jobTypeRepository } from "@/modules/workforce/repository/job-type.repository"
import type {
  JobTypeSummary,
  JobTypeFilters,
  CreateJobTypeDto,
  UpdateJobTypeDto,
} from "@/modules/workforce/types/workforce.types"
import type { PaginatedResponse } from "@/shared/types/api.types"

export const jobTypeService = {
  async getJobTypes(filters: JobTypeFilters): Promise<PaginatedResponse<JobTypeSummary>> {
    return jobTypeRepository.findMany(filters)
  },

  async getAllActiveJobTypes(): Promise<JobTypeSummary[]> {
    return jobTypeRepository.findAllActive()
  },

  async getJobTypeById(id: string): Promise<JobTypeSummary> {
    const jobType = await jobTypeRepository.findById(id)
    if (!jobType) throw new Error("JOB_TYPE_NOT_FOUND")
    return jobType
  },

  async createJobType(data: CreateJobTypeDto, createdById: string): Promise<JobTypeSummary> {
    const [nameTaken, slugTaken] = await Promise.all([
      jobTypeRepository.existsByName(data.name),
      jobTypeRepository.existsBySlug(data.slug),
    ])
    if (nameTaken) throw new Error("DUPLICATE_JOB_TYPE_NAME")
    if (slugTaken) throw new Error("DUPLICATE_JOB_TYPE_SLUG")
    return jobTypeRepository.create(data, createdById)
  },

  async updateJobType(data: UpdateJobTypeDto): Promise<JobTypeSummary> {
    const existing = await jobTypeRepository.findById(data.id)
    if (!existing) throw new Error("JOB_TYPE_NOT_FOUND")

    if (data.name && data.name !== existing.name) {
      const nameTaken = await jobTypeRepository.existsByName(data.name, data.id)
      if (nameTaken) throw new Error("DUPLICATE_JOB_TYPE_NAME")
    }
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await jobTypeRepository.existsBySlug(data.slug, data.id)
      if (slugTaken) throw new Error("DUPLICATE_JOB_TYPE_SLUG")
    }

    return jobTypeRepository.update(data)
  },

  async deleteJobType(id: string): Promise<void> {
    const exists = await jobTypeRepository.findById(id)
    if (!exists) throw new Error("JOB_TYPE_NOT_FOUND")
    const hasWorkers = await jobTypeRepository.hasWorkers(id)
    if (hasWorkers) throw new Error("JOB_TYPE_HAS_WORKERS")
    await jobTypeRepository.delete(id)
  },
}

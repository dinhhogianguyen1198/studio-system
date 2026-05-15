import { serviceDefinitionRepository } from "../repository/service-definition.repository"
import type {
  CreateServiceDefinitionDto,
  ServiceDefinitionDetail,
  ServiceDefinitionSummary,
  UpdateServiceDefinitionDto,
} from "../types/services.types"
import type { ServiceDefinitionFilters } from "../repository/service-definition.repository"

export const serviceDefinitionService = {
  async findMany(
    filters: ServiceDefinitionFilters,
  ): Promise<{ data: ServiceDefinitionSummary[]; total: number }> {
    return serviceDefinitionRepository.findMany(filters)
  },

  async findAllActive(): Promise<ServiceDefinitionSummary[]> {
    return serviceDefinitionRepository.findAllActive()
  },

  async findById(id: string): Promise<ServiceDefinitionDetail> {
    const service = await serviceDefinitionRepository.findById(id)
    if (!service) throw new Error("SERVICE_DEFINITION_NOT_FOUND")
    return service
  },

  async create(
    data: CreateServiceDefinitionDto,
    createdById: string,
  ): Promise<ServiceDefinitionDetail> {
    const existing = await serviceDefinitionRepository.findBySlug(data.slug)
    if (existing) throw new Error("SERVICE_DEFINITION_SLUG_DUPLICATE")
    return serviceDefinitionRepository.create(data, createdById)
  },

  async update(id: string, data: UpdateServiceDefinitionDto): Promise<ServiceDefinitionDetail> {
    await serviceDefinitionService.findById(id)
    if (data.slug) {
      const existing = await serviceDefinitionRepository.findBySlug(data.slug)
      if (existing && existing.id !== id) throw new Error("SERVICE_DEFINITION_SLUG_DUPLICATE")
    }
    return serviceDefinitionRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    await serviceDefinitionService.findById(id)
    await serviceDefinitionRepository.delete(id)
  },
}

import { orderManagementUnitRepository } from "../repository/order-management-unit.repository"
import type {
  CreateOrderManagementUnitDto,
  OrderManagementUnitFilters,
  OrderManagementUnitSummary,
  UpdateOrderManagementUnitDto,
} from "../types/order-management-unit.types"

export const orderManagementUnitService = {
  async findMany(
    filters: OrderManagementUnitFilters,
  ): Promise<{ data: OrderManagementUnitSummary[]; total: number }> {
    return orderManagementUnitRepository.findMany(filters)
  },

  async findAllActive(): Promise<OrderManagementUnitSummary[]> {
    return orderManagementUnitRepository.findAllActive()
  },

  async create(
    data: CreateOrderManagementUnitDto,
    createdById: string,
  ): Promise<OrderManagementUnitSummary> {
    const existing = await orderManagementUnitRepository.findByName(data.name)
    if (existing) throw new Error("ORDER_MANAGEMENT_UNIT_NAME_DUPLICATE")
    return orderManagementUnitRepository.create(data, createdById)
  },

  async update(
    id: string,
    data: UpdateOrderManagementUnitDto,
  ): Promise<OrderManagementUnitSummary> {
    const existing = await orderManagementUnitRepository.findById(id)
    if (!existing) throw new Error("ORDER_MANAGEMENT_UNIT_NOT_FOUND")
    if (data.name && data.name !== existing.name) {
      const duplicate = await orderManagementUnitRepository.findByName(data.name)
      if (duplicate) throw new Error("ORDER_MANAGEMENT_UNIT_NAME_DUPLICATE")
    }
    return orderManagementUnitRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    const existing = await orderManagementUnitRepository.findById(id)
    if (!existing) throw new Error("ORDER_MANAGEMENT_UNIT_NOT_FOUND")
    return orderManagementUnitRepository.delete(id)
  },
}

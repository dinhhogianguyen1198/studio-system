import { db } from "@/shared/lib/prisma"
import type { Prisma } from "@prisma/client"
import type {
  CreateOrderManagementUnitDto,
  OrderManagementUnitFilters,
  OrderManagementUnitSummary,
  UpdateOrderManagementUnitDto,
} from "../types/order-management-unit.types"
import { orderManagementUnitSummarySelect } from "../types/order-management-unit.types"

export const orderManagementUnitRepository = {
  async findMany(
    filters: OrderManagementUnitFilters,
  ): Promise<{ data: OrderManagementUnitSummary[]; total: number }> {
    const { isActive, search, page, pageSize } = filters
    const where: Prisma.OrderManagementUnitWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    }
    const [data, total] = await Promise.all([
      db.orderManagementUnit.findMany({
        where,
        select: orderManagementUnitSummarySelect,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.orderManagementUnit.count({ where }),
    ])
    return { data, total }
  },

  async findAllActive(): Promise<OrderManagementUnitSummary[]> {
    return db.orderManagementUnit.findMany({
      where: { isActive: true },
      select: orderManagementUnitSummarySelect,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })
  },

  async findById(id: string): Promise<OrderManagementUnitSummary | null> {
    return db.orderManagementUnit.findUnique({
      where: { id },
      select: orderManagementUnitSummarySelect,
    })
  },

  async findByName(name: string): Promise<{ id: string } | null> {
    return db.orderManagementUnit.findUnique({
      where: { name },
      select: { id: true },
    })
  },

  async create(
    data: CreateOrderManagementUnitDto,
    createdById: string,
  ): Promise<OrderManagementUnitSummary> {
    return db.orderManagementUnit.create({
      data: { ...data, createdById },
      select: orderManagementUnitSummarySelect,
    })
  },

  async update(id: string, data: UpdateOrderManagementUnitDto): Promise<OrderManagementUnitSummary> {
    return db.orderManagementUnit.update({
      where: { id },
      data,
      select: orderManagementUnitSummarySelect,
    })
  },

  async delete(id: string): Promise<void> {
    await db.orderManagementUnit.delete({ where: { id } })
  },
}

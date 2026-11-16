import { describe, it, expect, vi, beforeEach } from "vitest"
import { prismaMock } from "@/test/mocks/prisma"

vi.mock("@/shared/lib/prisma", () => ({ db: prismaMock }))
vi.mock("@/modules/orders/repository/order.repository")

import { orderService } from "../order.service"
import { orderRepository } from "@/modules/orders/repository/order.repository"

const mockRepo = vi.mocked(orderRepository)

describe("orderService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("findById", () => {
    it("returns order when found", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-2026-0001",
        status: "NEW",
      }
      mockRepo.findById.mockResolvedValue(mockOrder as never)

      const result = await orderService.findById("order-1")

      expect(result).toEqual(mockOrder)
      expect(mockRepo.findById).toHaveBeenCalledWith("order-1")
    })

    it("throws ORDER_NOT_FOUND when order does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(orderService.findById("nonexistent")).rejects.toThrow("ORDER_NOT_FOUND")
    })
  })

  describe("findMany", () => {
    it("delegates to repository and returns paginated result", async () => {
      const mockResult = { data: [], total: 0 }
      mockRepo.findMany.mockResolvedValue(mockResult as never)

      const filters = { page: 1, pageSize: 20 }
      const result = await orderService.findMany(filters as never)

      expect(result).toEqual(mockResult)
      expect(mockRepo.findMany).toHaveBeenCalledWith(filters)
    })
  })

  describe("create with atomic D1 sequence", () => {
    it("uses the sequence value returned by SQLite", async () => {
      const year = new Date().getFullYear()
      prismaMock.$queryRaw.mockResolvedValue([{ value: 1 }])
      mockRepo.create.mockResolvedValue({ id: "ord-1" } as never)
      const input = { contactName: "Test" }
      await orderService.create(input, "user-1")
      expect(mockRepo.create).toHaveBeenCalledWith(input, "user-1", `ORD-${year}-0001`)
    })

    it("formats sequence values larger than four digits without truncation", async () => {
      const year = new Date().getFullYear()
      prismaMock.$queryRaw.mockResolvedValue([{ value: 10001 }])
      mockRepo.create.mockResolvedValue({ id: "ord-2" } as never)
      const input = { contactName: "Test" }
      await orderService.create(input, "user-1")
      expect(mockRepo.create).toHaveBeenCalledWith(input, "user-1", `ORD-${year}-10001`)
    })
  })
})

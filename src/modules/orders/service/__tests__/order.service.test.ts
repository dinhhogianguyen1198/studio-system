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

  describe("generateOrderNumber (via createOrder)", () => {
    it("generates ORD-YEAR-0001 format for the first order of the year", async () => {
      const year = new Date().getFullYear()

      prismaMock.$transaction.mockImplementation(async (fn) => {
        const txMock = {
          $queryRaw: vi.fn().mockResolvedValue([]),
          order: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return fn(txMock as never)
      })

      const expected = `ORD-${year}-0001`

      mockRepo.create.mockResolvedValue({ id: "ord-1", orderNumber: expected } as never)

      await orderService.createOrder(
        { customerId: "cust-1", items: [] } as never,
        "user-1"
      )

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderNumber: expected }),
        "user-1"
      )
    })

    it("increments sequence number from last order in current year", async () => {
      const year = new Date().getFullYear()

      prismaMock.$transaction.mockImplementation(async (fn) => {
        const txMock = {
          $queryRaw: vi.fn().mockResolvedValue([]),
          order: {
            findFirst: vi.fn().mockResolvedValue({ orderNumber: `ORD-${year}-0005` }),
          },
        }
        return fn(txMock as never)
      })

      mockRepo.create.mockResolvedValue({
        id: "ord-2",
        orderNumber: `ORD-${year}-0006`,
      } as never)

      await orderService.createOrder(
        { customerId: "cust-1", items: [] } as never,
        "user-1"
      )

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderNumber: `ORD-${year}-0006` }),
        "user-1"
      )
    })
  })
})

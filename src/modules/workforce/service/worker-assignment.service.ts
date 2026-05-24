import { Prisma } from "@prisma/client"
import { workerAssignmentRepository } from "@/modules/workforce/repository/worker-assignment.repository"
import { workerRepository } from "@/modules/workforce/repository/worker.repository"
import { jobTypeRepository } from "@/modules/workforce/repository/job-type.repository"
import type {
  OrderItemWorkerDetail,
  PayrollFilters,
  AssignWorkerDto,
  UpdateAssignmentStatusDto,
  WorkerAssignmentStatus,
} from "@/modules/workforce/types/workforce.types"

export const workerAssignmentService = {
  async getAssignmentsByOrderItem(orderItemId: string): Promise<OrderItemWorkerDetail[]> {
    return workerAssignmentRepository.findByOrderItem(orderItemId)
  },

  // Fix #2: Batch load assignments — 1 query cho nhiều items thay vì N queries
  async getAssignmentsByOrderItemIds(
    orderItemIds: string[],
  ): Promise<Map<string, OrderItemWorkerDetail[]>> {
    return workerAssignmentRepository.findByOrderItemIds(orderItemIds)
  },

  async getAssignments(filters: PayrollFilters): Promise<OrderItemWorkerDetail[]> {
    return workerAssignmentRepository.findMany(filters)
  },

  async assignWorker(data: AssignWorkerDto, assignedById: string): Promise<OrderItemWorkerDetail> {
    // Check duplicate assignment
    const exists = await workerAssignmentRepository.existsAssignment(
      data.orderItemId,
      data.workerId,
      data.jobTypeId,
    )
    if (exists) throw new Error("DUPLICATE_ASSIGNMENT")

    // Fetch worker and job type for snapshots
    const [worker, jobType] = await Promise.all([
      workerRepository.findById(data.workerId),
      jobTypeRepository.findById(data.jobTypeId),
    ])
    if (!worker) throw new Error("WORKER_NOT_FOUND")
    if (!jobType) throw new Error("JOB_TYPE_NOT_FOUND")

    // Check worker has this job type skill
    const hasSkill = worker.jobTypes.some((wjt) => wjt.jobType.id === data.jobTypeId)
    if (!hasSkill) throw new Error("WORKER_MISSING_SKILL")

    // Find effective rate
    const rate = await workerAssignmentRepository.findEffectiveRate(data.workerId, data.jobTypeId)
    if (!rate) throw new Error("NO_RATE_CONFIGURED")

    const rateAmount = new Prisma.Decimal(rate.amount)
    const quantity = new Prisma.Decimal(data.quantity)
    const totalCost = rateAmount.mul(quantity)

    return workerAssignmentRepository.create({
      orderItemId: data.orderItemId,
      workerId: data.workerId,
      jobTypeId: data.jobTypeId,
      workerNameSnapshot: worker.name,
      jobTypeNameSnapshot: jobType.name,
      rateTypeSnapshot: rate.rateType,
      rateAmountSnapshot: rateAmount,
      quantity,
      totalCost,
      notes: data.notes,
      assignedById,
    })
  },

  async updateAssignmentStatus(
    data: UpdateAssignmentStatusDto,
    updatedById: string,
  ): Promise<OrderItemWorkerDetail> {
    const assignment = await workerAssignmentRepository.findById(data.id)
    if (!assignment) throw new Error("ASSIGNMENT_NOT_FOUND")

    // Validate status transition: IN_PROGRESS → COMPLETED only
    const validTransitions: Record<string, WorkerAssignmentStatus[]> = {
      IN_PROGRESS: ["COMPLETED"],
      COMPLETED: [],
    }
    const allowed = validTransitions[assignment.status] ?? []
    if (!allowed.includes(data.status as WorkerAssignmentStatus)) {
      throw new Error("INVALID_STATUS_TRANSITION")
    }

    const now = new Date()
    const startedAt = undefined
    const completedAt = data.status === "COMPLETED" ? now : undefined

    return workerAssignmentRepository.updateStatus(
      data.id,
      data.status,
      data.notes,
      startedAt,
      completedAt,
    )
  },

  async removeAssignment(id: string): Promise<void> {
    const assignment = await workerAssignmentRepository.findById(id)
    if (!assignment) throw new Error("ASSIGNMENT_NOT_FOUND")
    if (assignment.status === "COMPLETED") throw new Error("CANNOT_REMOVE_COMPLETED_ASSIGNMENT")
    await workerAssignmentRepository.delete(id)
  },

  async markAsPaid(id: string): Promise<OrderItemWorkerDetail> {
    const assignment = await workerAssignmentRepository.findById(id)
    if (!assignment) throw new Error("ASSIGNMENT_NOT_FOUND")
    if (assignment.paidAt) throw new Error("ALREADY_PAID")
    return workerAssignmentRepository.markAsPaid(id, new Date())
  },

  async markMultiplePaid(ids: string[]): Promise<{ count: number }> {
    if (ids.length === 0) return { count: 0 }
    return workerAssignmentRepository.markMultiplePaid(ids, new Date())
  },

  async getServiceCostSummary(orderItemId: string): Promise<{ totalCost: number; workerCount: number }> {
    return workerAssignmentRepository.getServiceCostSummary(orderItemId)
  },

  async getOrderCostSummary(orderId: string): Promise<number> {
    return workerAssignmentRepository.getOrderCostSummary(orderId)
  },
}

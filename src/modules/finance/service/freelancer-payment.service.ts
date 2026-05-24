import { Prisma } from "@prisma/client"
import { freelancerPaymentRepository } from "../repository/freelancer-payment.repository"
import type {
  CreateFreelancerPaymentInput,
  ProcessFreelancerPaymentInput,
  FreelancerPaymentFilters,
} from "../schemas/finance.schema"
import type { FreelancerPaymentSummary, FreelancerPaymentDetail } from "../types/finance.types"
import type { PaginatedResult } from "@/shared/types/api.types"

export const freelancerPaymentService = {
  async list(filters: FreelancerPaymentFilters): Promise<PaginatedResult<FreelancerPaymentSummary>> {
    return freelancerPaymentRepository.findMany(filters)
  },

  async getById(id: string): Promise<FreelancerPaymentDetail> {
    const payment = await freelancerPaymentRepository.findById(id)
    if (!payment) throw new Error("NOT_FOUND")
    return payment
  },

  async getUnpaidAssignments(workerId: string) {
    return freelancerPaymentRepository.findUnpaidAssignments(workerId)
  },

  async create(
    data: CreateFreelancerPaymentInput,
    createdById: string,
  ): Promise<FreelancerPaymentDetail> {
    const unpaid = await freelancerPaymentRepository.findUnpaidAssignments(data.workerId)
    const selectedAssignments = unpaid.filter((a) => data.assignmentIds.includes(a.id))

    if (selectedAssignments.length === 0) throw new Error("NO_VALID_ASSIGNMENTS")

    const totalAmount = selectedAssignments.reduce((sum, a) => sum + a.totalCost.toNumber(), 0)

    return freelancerPaymentRepository.create({
      workerId: data.workerId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      totalAmount: new Prisma.Decimal(totalAmount),
      notes: data.notes,
      createdById,
      items: selectedAssignments.map((a) => ({
        orderItemWorkerId: a.id,
        amount: new Prisma.Decimal(a.totalCost.toNumber()),
      })),
    })
  },

  async process(
    data: ProcessFreelancerPaymentInput,
    paidById: string,
  ): Promise<FreelancerPaymentDetail> {
    const existing = await freelancerPaymentRepository.findById(data.id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status === "PAID") throw new Error("PAYMENT_ALREADY_PAID")
    if (existing.status === "CANCELLED") throw new Error("PAYMENT_CANCELLED")

    return freelancerPaymentRepository.markPaid(data.id, {
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      paidById,
      notes: data.notes,
    })
  },

  async cancel(id: string): Promise<void> {
    const existing = await freelancerPaymentRepository.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.status === "PAID") throw new Error("CANNOT_CANCEL_PAID_PAYMENT")
    await freelancerPaymentRepository.cancel(id)
  },

  async countUnpaidWorkers(): Promise<number> {
    return freelancerPaymentRepository.countUnpaidWorkers()
  },
}

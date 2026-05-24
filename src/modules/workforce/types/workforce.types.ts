import type { Prisma } from "@prisma/client"

// ── Status constants (const object + type union pattern) ──────────────────────

export const WorkerAssignmentStatus = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const
export type WorkerAssignmentStatus = (typeof WorkerAssignmentStatus)[keyof typeof WorkerAssignmentStatus]

export const RateType = {
  PER_JOB: "PER_JOB",
  HOURLY: "HOURLY",
  DAILY: "DAILY",
} as const
export type RateType = (typeof RateType)[keyof typeof RateType]

// ── Select fragments ──────────────────────────────────────────────────────────

export const workerSummarySelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  jobTypes: {
    select: {
      isPrimary: true,
      jobType: {
        select: { id: true, name: true, color: true, slug: true },
      },
    },
  },
} satisfies Prisma.WorkerSelect

export const workerDetailSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  avatarUrl: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  jobTypes: {
    select: {
      isPrimary: true,
      jobType: {
        select: { id: true, name: true, color: true, slug: true },
      },
    },
  },
  rates: {
    where: { isActive: true },
    select: {
      id: true,
      jobTypeId: true,
      serviceDefinitionId: true,
      rateType: true,
      amount: true,
      currency: true,
      effectiveFrom: true,
      effectiveTo: true,
      note: true,
      jobType: { select: { id: true, name: true, color: true } },
      serviceDefinition: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.WorkerSelect

export const jobTypeSummarySelect = {
  id: true,
  name: true,
  slug: true,
  color: true,
  isActive: true,
  sortOrder: true,
  description: true,
  createdAt: true,
  _count: { select: { workers: true } },
} satisfies Prisma.JobTypeSelect

export const orderItemWorkerSelect = {
  id: true,
  orderItemId: true,
  workerId: true,
  jobTypeId: true,
  workerNameSnapshot: true,
  jobTypeNameSnapshot: true,
  rateTypeSnapshot: true,
  rateAmountSnapshot: true,
  quantity: true,
  totalCost: true,
  status: true,
  notes: true,
  startedAt: true,
  completedAt: true,
  paidAt: true,
  createdAt: true,
  worker: { select: { id: true, name: true, avatarUrl: true } },
  jobType: { select: { id: true, name: true, color: true } },
  assignedBy: { select: { id: true, name: true } },
  orderItem: {
    select: {
      id: true,
      name: true,
      order: { select: { id: true, orderNumber: true } },
    },
  },
} satisfies Prisma.OrderItemWorkerSelect

// ── Inferred DTO types ────────────────────────────────────────────────────────

export type WorkerSummary = Prisma.WorkerGetPayload<{ select: typeof workerSummarySelect }>
export type WorkerDetail = Prisma.WorkerGetPayload<{ select: typeof workerDetailSelect }>
export type JobTypeSummary = Prisma.JobTypeGetPayload<{ select: typeof jobTypeSummarySelect }>
export type OrderItemWorkerDetail = Prisma.OrderItemWorkerGetPayload<{ select: typeof orderItemWorkerSelect }>

// ── Filter types ──────────────────────────────────────────────────────────────

export interface WorkerFilters {
  page: number
  pageSize: number
  search?: string
  isActive?: boolean
  jobTypeId?: string
}

export interface JobTypeFilters {
  page: number
  pageSize: number
  search?: string
  isActive?: boolean
}

export interface PayrollFilters {
  orderItemId?: string
  workerId?: string
  jobTypeId?: string
  status?: WorkerAssignmentStatus
  dateFrom?: Date
  dateTo?: Date
}

// ── DTO input types ───────────────────────────────────────────────────────────

export interface CreateWorkerDto {
  name: string
  phone?: string | null
  email?: string | null
  avatarUrl?: string | null
  notes?: string | null
  isActive: boolean
  jobTypeIds: string[]
  primaryJobTypeId?: string | null
}

export interface UpdateWorkerDto extends Partial<CreateWorkerDto> {
  id: string
}

export interface CreateJobTypeDto {
  name: string
  slug: string
  color: string
  isActive: boolean
  sortOrder: number
  description?: string | null
}

export interface UpdateJobTypeDto extends Partial<CreateJobTypeDto> {
  id: string
}

export interface UpsertWorkerRateDto {
  workerId: string
  jobTypeId: string
  serviceDefinitionId?: string | null
  rateType: RateType
  amount: number
  currency: string
  effectiveFrom: Date
  effectiveTo?: Date | null
  note?: string | null
}

export interface AssignWorkerDto {
  orderItemId: string
  workerId: string
  jobTypeId: string
  quantity: number
  notes?: string | null
}

export interface UpdateAssignmentStatusDto {
  id: string
  status: WorkerAssignmentStatus
  notes?: string | null
}

// ── Payroll summary per worker ────────────────────────────────────────────────
// Defined after SerializedOrderItemWorkerDetail — forward-declared here, used below.

export interface WorkerPayrollSummary {
  workerId: string
  workerName: string
  workerAvatarUrl: string | null
  unpaidCount: number
  unpaidAmount: number
  assignmentIds: string[]
  assignments: SerializedOrderItemWorkerDetail[]
}

// ── Cost summary types ────────────────────────────────────────────────────────

export interface ServiceCostSummary {
  orderItemId: string
  orderItemName: string
  totalCost: number
  currency: string
  workerCount: number
  assignments: OrderItemWorkerDetail[]
}

export interface OrderCostSummary {
  orderId: string
  orderNumber: string
  totalRevenue: number
  totalCost: number
  estimatedProfit: number
  profitMargin: number
  currency: string
  services: ServiceCostSummary[]
}

// ── Serialized types (Decimal → number, Date → string) for Client Components ──

export type SerializedWorkerRate = Omit<
  WorkerDetail["rates"][number],
  "amount" | "effectiveFrom" | "effectiveTo"
> & {
  amount: number
  effectiveFrom: string
  effectiveTo: string | null
}

export type SerializedWorkerDetail = Omit<WorkerDetail, "createdAt" | "updatedAt" | "rates"> & {
  createdAt: string
  updatedAt: string
  rates: SerializedWorkerRate[]
}

export function serializeWorkerDetail(worker: WorkerDetail): SerializedWorkerDetail {
  return {
    ...worker,
    createdAt: worker.createdAt.toISOString(),
    updatedAt: worker.updatedAt.toISOString(),
    rates: worker.rates.map((r) => ({
      ...r,
      amount: Number(r.amount),
      effectiveFrom: r.effectiveFrom.toISOString(),
      effectiveTo: r.effectiveTo?.toISOString() ?? null,
    })),
  }
}

export type SerializedOrderItemWorkerDetail = Omit<
  OrderItemWorkerDetail,
  "rateAmountSnapshot" | "quantity" | "totalCost" | "paidAt" | "startedAt" | "completedAt" | "createdAt"
> & {
  rateAmountSnapshot: number
  quantity: number
  totalCost: number
  paidAt: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export function serializeOrderItemWorker(a: OrderItemWorkerDetail): SerializedOrderItemWorkerDetail {
  return {
    ...a,
    rateAmountSnapshot: Number(a.rateAmountSnapshot),
    quantity: Number(a.quantity),
    totalCost: Number(a.totalCost),
    paidAt: a.paidAt?.toISOString() ?? null,
    startedAt: a.startedAt?.toISOString() ?? null,
    completedAt: a.completedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }
}

// ── UI label maps ─────────────────────────────────────────────────────────────

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  PER_JOB: "Theo job",
  HOURLY: "Theo giờ",
  DAILY: "Theo ngày",
}

export const ASSIGNMENT_STATUS_LABELS: Record<WorkerAssignmentStatus, string> = {
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
}

export const ASSIGNMENT_STATUS_COLORS: Record<WorkerAssignmentStatus, string> = {
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
}

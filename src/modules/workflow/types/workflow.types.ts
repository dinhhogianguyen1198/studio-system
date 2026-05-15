import type { Prisma } from "@prisma/client"

// ─── Select fragments ──────────────────────────────────────────────────────────

export const workflowStepSummarySelect = {
  id: true,
  key: true,
  name: true,
  color: true,
  sortOrder: true,
  isFinal: true,
  templateId: true,
} satisfies Prisma.WorkflowStepSelect

export const workflowTransitionSelect = {
  id: true,
  fromStepId: true,
  toStepId: true,
  label: true,
  requireNote: true,
  toStep: { select: workflowStepSummarySelect },
} satisfies Prisma.WorkflowStepTransitionSelect

export const workflowTemplateSummarySelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  steps: {
    select: workflowStepSummarySelect,
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.WorkflowTemplateSelect

export const workflowTemplateDetailSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true } },
  steps: {
    select: {
      ...workflowStepSummarySelect,
      outgoingTransitions: { select: workflowTransitionSelect },
    },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.WorkflowTemplateSelect

export const workflowLogSelect = {
  id: true,
  orderItemId: true,
  fromStepId: true,
  toStepKey: true,
  toStepName: true,
  note: true,
  createdAt: true,
  changedBy: { select: { id: true, name: true } },
} satisfies Prisma.OrderItemWorkflowLogSelect

// ─── Inferred types ────────────────────────────────────────────────────────────

export type WorkflowStepSummary = Prisma.WorkflowStepGetPayload<{
  select: typeof workflowStepSummarySelect
}>

export type WorkflowTransition = Prisma.WorkflowStepTransitionGetPayload<{
  select: typeof workflowTransitionSelect
}>

export type WorkflowTemplateSummary = Prisma.WorkflowTemplateGetPayload<{
  select: typeof workflowTemplateSummarySelect
}>

export type WorkflowTemplateDetail = Prisma.WorkflowTemplateGetPayload<{
  select: typeof workflowTemplateDetailSelect
}>

export type WorkflowLog = Prisma.OrderItemWorkflowLogGetPayload<{
  select: typeof workflowLogSelect
}>

// ─── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateWorkflowTemplateDto {
  name: string
  description?: string
}

export interface UpdateWorkflowTemplateDto {
  name?: string
  description?: string
}

export interface CreateWorkflowStepDto {
  templateId: string
  key: string
  name: string
  description?: string
  color?: string
  sortOrder?: number
  isFinal?: boolean
}

export interface CreateWorkflowTransitionDto {
  fromStepId: string
  toStepId: string
  label?: string
  requireNote?: boolean
}

export interface WorkflowTransitionRequest {
  orderItemId: string
  targetStepId: string
  note?: string
}

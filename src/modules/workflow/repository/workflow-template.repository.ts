import { db } from "@/shared/lib/prisma"
import type {
  CreateWorkflowStepDto,
  CreateWorkflowTemplateDto,
  CreateWorkflowTransitionDto,
  UpdateWorkflowTemplateDto,
  WorkflowTemplateDetail,
  WorkflowTemplateSummary,
} from "../types/workflow.types"
import {
  workflowTemplateDetailSelect,
  workflowTemplateSummarySelect,
} from "../types/workflow.types"

export const workflowTemplateRepository = {
  async findMany(): Promise<WorkflowTemplateSummary[]> {
    return db.workflowTemplate.findMany({
      select: workflowTemplateSummarySelect,
      orderBy: { createdAt: "desc" },
    })
  },

  async findById(id: string): Promise<WorkflowTemplateDetail | null> {
    return db.workflowTemplate.findUnique({
      where: { id },
      select: workflowTemplateDetailSelect,
    })
  },

  async create(
    data: CreateWorkflowTemplateDto,
    createdById: string,
  ): Promise<WorkflowTemplateDetail> {
    return db.workflowTemplate.create({
      data: { ...data, createdById },
      select: workflowTemplateDetailSelect,
    })
  },

  async update(id: string, data: UpdateWorkflowTemplateDto): Promise<WorkflowTemplateDetail> {
    return db.workflowTemplate.update({
      where: { id },
      data,
      select: workflowTemplateDetailSelect,
    })
  },

  async delete(id: string): Promise<void> {
    await db.workflowTemplate.delete({ where: { id } })
  },

  // ─── Steps ────────────────────────────────────────────────────────────────────

  async createStep(data: CreateWorkflowStepDto): Promise<void> {
    await db.workflowStep.create({ data })
  },

  async updateStep(
    stepId: string,
    data: Partial<Omit<CreateWorkflowStepDto, "templateId">>,
  ): Promise<void> {
    await db.workflowStep.update({ where: { id: stepId }, data })
  },

  async deleteStep(stepId: string): Promise<void> {
    await db.workflowStep.delete({ where: { id: stepId } })
  },

  async reorderSteps(steps: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await db.$transaction(
      steps.map((s) =>
        db.workflowStep.update({
          where: { id: s.id },
          data: { sortOrder: s.sortOrder },
        }),
      ),
    )
  },

  // ─── Transitions ──────────────────────────────────────────────────────────────

  async createTransition(data: CreateWorkflowTransitionDto): Promise<void> {
    await db.workflowStepTransition.create({ data })
  },

  async deleteTransition(fromStepId: string, toStepId: string): Promise<void> {
    await db.workflowStepTransition.delete({
      where: { fromStepId_toStepId: { fromStepId, toStepId } },
    })
  },
}

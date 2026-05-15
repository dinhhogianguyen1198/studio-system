import { workflowTemplateRepository } from "../repository/workflow-template.repository"
import type {
  CreateWorkflowStepDto,
  CreateWorkflowTemplateDto,
  CreateWorkflowTransitionDto,
  UpdateWorkflowTemplateDto,
  WorkflowTemplateDetail,
  WorkflowTemplateSummary,
} from "../types/workflow.types"

export const workflowTemplateService = {
  async findMany(): Promise<WorkflowTemplateSummary[]> {
    return workflowTemplateRepository.findMany()
  },

  async findById(id: string): Promise<WorkflowTemplateDetail> {
    const template = await workflowTemplateRepository.findById(id)
    if (!template) throw new Error("WORKFLOW_TEMPLATE_NOT_FOUND")
    return template
  },

  async create(
    data: CreateWorkflowTemplateDto,
    createdById: string,
  ): Promise<WorkflowTemplateDetail> {
    return workflowTemplateRepository.create(data, createdById)
  },

  async update(id: string, data: UpdateWorkflowTemplateDto): Promise<WorkflowTemplateDetail> {
    await workflowTemplateService.findById(id)
    return workflowTemplateRepository.update(id, data)
  },

  async delete(id: string): Promise<void> {
    const template = await workflowTemplateRepository.findById(id)
    if (!template) throw new Error("WORKFLOW_TEMPLATE_NOT_FOUND")
    if (template.steps.length > 0) throw new Error("WORKFLOW_TEMPLATE_HAS_STEPS")
    await workflowTemplateRepository.delete(id)
  },

  // ─── Steps ────────────────────────────────────────────────────────────────────

  async createStep(data: CreateWorkflowStepDto): Promise<void> {
    await workflowTemplateService.findById(data.templateId)
    await workflowTemplateRepository.createStep(data)
  },

  async updateStep(
    stepId: string,
    data: Partial<Omit<CreateWorkflowStepDto, "templateId">>,
  ): Promise<void> {
    await workflowTemplateRepository.updateStep(stepId, data)
  },

  async deleteStep(stepId: string): Promise<void> {
    await workflowTemplateRepository.deleteStep(stepId)
  },

  async reorderSteps(steps: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await workflowTemplateRepository.reorderSteps(steps)
  },

  // ─── Transitions ──────────────────────────────────────────────────────────────

  async createTransition(data: CreateWorkflowTransitionDto): Promise<void> {
    if (data.fromStepId === data.toStepId) throw new Error("SELF_TRANSITION_NOT_ALLOWED")
    await workflowTemplateRepository.createTransition(data)
  },

  async deleteTransition(fromStepId: string, toStepId: string): Promise<void> {
    await workflowTemplateRepository.deleteTransition(fromStepId, toStepId)
  },
}

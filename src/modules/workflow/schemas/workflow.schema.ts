import { z } from "zod"

export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(1, "Tên template không được trống").max(100),
  description: z.string().max(500).optional(),
})

export const updateWorkflowTemplateSchema = createWorkflowTemplateSchema.partial()

export const createWorkflowStepSchema = z.object({
  templateId: z.string().cuid("templateId không hợp lệ"),
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z_]+$/, "Key chỉ được dùng CHỮ HOA và dấu gạch dưới"),
  name: z.string().min(1, "Tên bước không được trống").max(100),
  description: z.string().max(500).optional(),
  color: z.string().max(30).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isFinal: z
    .string()
    .optional()
    .transform((v) => v === "true"),
})

export const updateWorkflowStepSchema = createWorkflowStepSchema
  .omit({ templateId: true, key: true })
  .partial()

export const createWorkflowTransitionSchema = z.object({
  fromStepId: z.string().cuid(),
  toStepId: z.string().cuid(),
  label: z.string().max(100).optional(),
  requireNote: z
    .string()
    .optional()
    .transform((v) => v === "true"),
})

export const workflowTransitionRequestSchema = z.object({
  orderItemId: z.string().cuid(),
  targetStepId: z.string().cuid(),
  note: z.string().max(1000).optional(),
})

export type CreateWorkflowTemplateInput = z.infer<typeof createWorkflowTemplateSchema>
export type UpdateWorkflowTemplateInput = z.infer<typeof updateWorkflowTemplateSchema>
export type CreateWorkflowStepInput = z.infer<typeof createWorkflowStepSchema>
export type CreateWorkflowTransitionInput = z.infer<typeof createWorkflowTransitionSchema>
export type WorkflowTransitionRequestInput = z.infer<typeof workflowTransitionRequestSchema>

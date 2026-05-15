import { db } from "@/shared/lib/prisma"
import { validateTransition } from "../engine/workflow.engine"
import { workflowLogRepository } from "../repository/workflow-log.repository"
import type { WorkflowLog } from "../types/workflow.types"

export const workflowTransitionService = {
  async transition(
    orderItemId: string,
    targetStepId: string,
    note: string | undefined,
    changedById: string,
  ): Promise<void> {
    // 1. Load item + current step + all transitions cho template
    const item = await db.orderItem.findUnique({
      where: { id: orderItemId },
      select: {
        id: true,
        currentStepId: true,
        serviceDefinition: {
          select: { workflowTemplateId: true },
        },
      },
    })
    if (!item) throw new Error("ORDER_ITEM_NOT_FOUND")
    if (!item.serviceDefinition.workflowTemplateId)
      throw new Error("ORDER_ITEM_HAS_NO_WORKFLOW")

    const availableTransitions = await workflowLogRepository.loadTransitionsForOrderItem(orderItemId)

    // 2. Validate via engine (pure)
    validateTransition(
      {
        currentStepId: item.currentStepId,
        targetStepId,
        availableTransitions,
      },
      note,
    )

    // 3. Load target step info for snapshot
    const targetStep = await db.workflowStep.findUnique({
      where: { id: targetStepId },
      select: { key: true, name: true },
    })
    if (!targetStep) throw new Error("WORKFLOW_STEP_NOT_FOUND")

    // 4. Transaction: update item + write log
    await db.$transaction(async (tx) => {
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: { currentStepId: targetStepId },
      })

      await tx.orderItemWorkflowLog.create({
        data: {
          orderItemId,
          fromStepId: item.currentStepId,
          toStepKey: targetStep.key,
          toStepName: targetStep.name,
          note: note?.trim() || null,
          changedById,
        },
      })
    })
  },

  async getLog(orderItemId: string): Promise<WorkflowLog[]> {
    return workflowLogRepository.findByOrderItem(orderItemId)
  },
}

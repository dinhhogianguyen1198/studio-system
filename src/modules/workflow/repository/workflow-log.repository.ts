import { db } from "@/shared/lib/prisma"
import type { WorkflowLog } from "../types/workflow.types"
import { workflowLogSelect } from "../types/workflow.types"
import type { TransitionRule } from "../engine/workflow.engine"

export const workflowLogRepository = {
  async findByOrderItem(orderItemId: string): Promise<WorkflowLog[]> {
    return db.orderItemWorkflowLog.findMany({
      where: { orderItemId },
      select: workflowLogSelect,
      orderBy: { createdAt: "asc" },
    })
  },

  /**
   * Load tất cả transitions của một order item dựa trên workflowTemplate
   * gắn với serviceDefinition của item đó.
   */
  async loadTransitionsForOrderItem(orderItemId: string): Promise<TransitionRule[]> {
    const item = await db.orderItem.findUnique({
      where: { id: orderItemId },
      select: {
        currentStepId: true,
        serviceDefinition: {
          select: {
            workflowTemplate: {
              select: {
                steps: {
                  select: {
                    id: true,
                    outgoingTransitions: {
                      select: {
                        fromStepId: true,
                        toStepId: true,
                        requireNote: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!item?.serviceDefinition.workflowTemplate) return []

    return item.serviceDefinition.workflowTemplate.steps.flatMap((step) =>
      step.outgoingTransitions.map((t) => ({
        fromStepId: t.fromStepId,
        toStepId: t.toStepId,
        requireNote: t.requireNote,
      })),
    )
  },

  async writeLog(data: {
    orderItemId: string
    fromStepId: string | null
    toStepKey: string
    toStepName: string
    note: string | undefined
    changedById: string
  }): Promise<void> {
    await db.orderItemWorkflowLog.create({
      data: {
        orderItemId: data.orderItemId,
        fromStepId: data.fromStepId,
        toStepKey: data.toStepKey,
        toStepName: data.toStepName,
        note: data.note,
        changedById: data.changedById,
      },
    })
  },
}

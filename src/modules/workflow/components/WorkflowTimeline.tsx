import { db } from "@/shared/lib/prisma"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { workflowLogSelect } from "../types/workflow.types"

interface Props {
  orderItemId: string
}

export async function WorkflowTimeline({ orderItemId }: Props) {
  const logs = await db.orderItemWorkflowLog.findMany({
    where: { orderItemId },
    select: workflowLogSelect,
    orderBy: { createdAt: "asc" },
  })

  if (logs.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Lịch sử workflow
      </p>
      <ol className="border-muted-foreground/20 space-y-2 border-l-2 pl-4">
        {logs.map((log) => (
          <li key={log.id} className="relative">
            <span className="bg-muted-foreground/40 absolute -left-[1.3rem] mt-1.5 h-2 w-2 rounded-full" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{log.toStepName}</p>
                {log.note && (
                  <p className="text-muted-foreground text-xs">{log.note}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  bởi {log.changedBy.name}
                </p>
              </div>
              <time className="text-muted-foreground shrink-0 text-xs">
                {format(new Date(log.createdAt), "dd/MM HH:mm", { locale: vi })}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

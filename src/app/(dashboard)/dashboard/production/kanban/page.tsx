import { requirePermission } from "@/shared/lib/auth-utils"
import { productionService } from "@/modules/production/service/production.service"
import { KanbanBoard } from "@/modules/production/components/kanban/KanbanBoard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kanban sản xuất",
}

// Revalidate every 60s server-side as a safety net
export const revalidate = 60

export default async function KanbanPage() {
  await requirePermission("orders", "read")

  const [columns, units] = await Promise.all([
    productionService.getKanbanColumns({}),
    productionService.getOrderManagementUnits(),
  ])

  return (
    <div className="h-full">
      <KanbanBoard initialColumns={columns} units={units} />
    </div>
  )
}

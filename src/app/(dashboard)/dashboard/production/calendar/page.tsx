import { requirePermission } from "@/shared/lib/auth-utils"
import { productionService } from "@/modules/production/service/production.service"
import { ProductionCalendar } from "@/modules/production/components/calendar/ProductionCalendar"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Calendar sản xuất",
}

export const revalidate = 60

export default async function CalendarPage() {
  await requirePermission("orders", "read")

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 3, 0)

  const [events, units] = await Promise.all([
    productionService.getCalendarEvents({ start, end }),
    productionService.getOrderManagementUnits(),
  ])

  return (
    <div className="h-full min-h-[600px]">
      <ProductionCalendar initialEvents={events} units={units} />
    </div>
  )
}

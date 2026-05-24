import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"
import { Plus, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  userName: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Chào buổi sáng"
  if (hour < 18) return "Chào buổi chiều"
  return "Chào buổi tối"
}

export function DashboardHeader({
  userName,
}: DashboardHeaderProps): React.ReactElement {
  const now = new Date()
  const formattedDate = format(now, "EEEE, 'ngày' dd 'tháng' MM 'năm' yyyy", {
    locale: vi,
  })

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()},{" "}
          <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">
          {formattedDate}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/orders">
            <CalendarDays className="h-4 w-4 mr-1.5" />
            Xem lịch
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/dashboard/orders/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Tạo đơn hàng
          </Link>
        </Button>
      </div>
    </div>
  )
}

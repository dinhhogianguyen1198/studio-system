import Link from "next/link"
import { KanbanSquare, CalendarRange } from "lucide-react"
import type { ReactNode } from "react"

export default function ProductionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Module header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vận hành sản xuất</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Theo dõi workflow và timeline đơn hàng
          </p>
        </div>

        {/* Tab navigation */}
        <nav className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <TabLink href="/dashboard/production/kanban" icon={KanbanSquare} label="Kanban" />
          <TabLink href="/dashboard/production/calendar" icon={CalendarRange} label="Calendar" />
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}

interface TabLinkProps {
  href: string
  icon: React.ElementType
  label: string
}

function TabLink({ href, icon: Icon, label }: TabLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  )
}

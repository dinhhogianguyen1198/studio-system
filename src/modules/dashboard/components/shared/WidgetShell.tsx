import { cn } from "@/lib/utils"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface WidgetShellProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: { label: string; href: string }
  children: React.ReactNode
  className?: string
}

export function WidgetShell({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
}: WidgetShellProps): React.ReactElement {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-5 transition-all duration-200",
        "hover:shadow-sm hover:border-border/60",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {action.label} →
          </Link>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  )
}

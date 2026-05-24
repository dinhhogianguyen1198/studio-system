import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/30" strokeWidth={1.5} />
      <p className="text-sm font-medium text-muted-foreground mt-3">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">
          {description}
        </p>
      )}
      {action && (
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}

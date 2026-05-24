import { Skeleton } from "@/components/ui/skeleton"

interface WidgetSkeletonProps {
  lines?: number
  hasHeader?: boolean
}

export function WidgetSkeleton({
  lines = 4,
  hasHeader = true,
}: WidgetSkeletonProps): React.ReactElement {
  const widths = ["w-full", "w-4/5", "w-3/5", "w-5/6", "w-2/3", "w-4/6"]

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      {hasHeader && (
        <div className="pb-4 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            className={`h-4 ${widths[i % widths.length]}`}
          />
        ))}
      </div>
    </div>
  )
}

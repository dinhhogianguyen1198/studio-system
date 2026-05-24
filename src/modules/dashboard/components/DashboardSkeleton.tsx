import { Skeleton } from "@/components/ui/skeleton"
import { WidgetSkeleton } from "./shared/WidgetSkeleton"

export function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-9 w-32 mt-3" />
            <Skeleton className="h-3 w-40 mt-2" />
            <div className="border-t border-border/50 mt-3 pt-3">
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetSkeleton lines={5} />
        <WidgetSkeleton lines={6} />
      </div>

      {/* Secondary Content Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <WidgetSkeleton lines={4} />
        <WidgetSkeleton lines={4} />
        <WidgetSkeleton lines={5} />
      </div>

      {/* Chart Skeleton */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="space-y-2 pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-[280px] w-full rounded-md" />
      </div>
    </div>
  )
}

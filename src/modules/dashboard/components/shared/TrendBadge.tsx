import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendBadgeProps {
  value: number | null
  suffix?: string
}

export function TrendBadge({
  value,
  suffix = "so với tháng trước",
}: TrendBadgeProps): React.ReactElement {
  if (value === null || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>Không đổi</span>
      </span>
    )
  }

  const isPositive = value > 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isPositive ? "text-success-foreground" : "text-destructive",
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span>
        {isPositive ? "+" : ""}
        {value}%
      </span>
      <span className="text-muted-foreground font-normal">{suffix}</span>
    </span>
  )
}

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Rounded-md (not pill) — more enterprise, less playful
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        // Near-black — strong emphasis
        default:     "border-transparent bg-primary text-primary-foreground",
        // Neutral fill — secondary label
        secondary:   "border-transparent bg-secondary text-secondary-foreground",
        // Danger
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        // Outline — subtle
        outline:     "border-border text-foreground",
        // Semantic — use CSS token, auto-adapts light/dark
        success:     "border-transparent bg-success text-success-foreground",
        warning:     "border-transparent bg-warning text-warning-foreground",
        info:        "border-transparent bg-info text-info-foreground",
        // De-emphasised label
        muted:       "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — shared across all variants
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap select-none transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Near-black fill — premium default (Notion/Linear style)
        default:
          "bg-primary text-primary-foreground hover:bg-primary/85 active:bg-primary/90",
        // Subtle fill — secondary actions
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-muted",
        // Transparent with border — tertiary actions
        outline:
          "border-border bg-transparent text-foreground hover:bg-muted dark:border-input dark:hover:bg-accent",
        // Borderless ghost — inline / toolbar actions
        ghost:
          "bg-transparent text-foreground hover:bg-muted dark:hover:bg-accent",
        // Danger — soft style, not filled red
        destructive:
          "bg-destructive/8 text-destructive border-destructive/15 hover:bg-destructive/15 active:bg-destructive/20 focus-visible:ring-destructive/30 dark:bg-destructive/15 dark:border-destructive/20 dark:hover:bg-destructive/25",
        // Text link
        link: "bg-transparent text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 text-sm",
        xs:       "h-6 px-2 text-xs rounded-[calc(var(--radius)-2px)] [&_svg:not([class*='size-'])]:size-3",
        sm:       "h-7 px-2.5 text-[0.8125rem] rounded-[calc(var(--radius)-1px)] [&_svg:not([class*='size-'])]:size-3.5",
        lg:       "h-9 px-4 text-sm",
        xl:       "h-10 px-5 text-sm",
        icon:     "size-8",
        "icon-xs":"size-6 rounded-[calc(var(--radius)-2px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":"size-7 rounded-[calc(var(--radius)-1px)] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg":"size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

/**
 * Underline-style tabs — enterprise default.
 * Use variant="pills" for segmented-control look (compact areas).
 */
const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "underline" | "pills"
  }
>(({ className, variant = "underline", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    data-variant={variant}
    className={cn(
      variant === "underline" && "flex items-center gap-0 border-b border-border",
      variant === "pills" && "inline-flex h-9 items-center rounded-lg bg-muted p-1 gap-0",
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium",
      "select-none outline-none transition-colors",
      "disabled:pointer-events-none disabled:opacity-40",
      "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:rounded-sm",
      // Underline style — parent sets data-variant=underline
      "in-data-[variant=underline]:h-9 in-data-[variant=underline]:px-3",
      "in-data-[variant=underline]:border-b-2 in-data-[variant=underline]:border-transparent in-data-[variant=underline]:-mb-px",
      "in-data-[variant=underline]:text-muted-foreground in-data-[variant=underline]:hover:text-foreground",
      "in-data-[variant=underline]:data-[state=active]:border-foreground in-data-[variant=underline]:data-[state=active]:text-foreground",
      // Pills style — parent sets data-variant=pills
      "in-data-[variant=pills]:rounded-md in-data-[variant=pills]:px-3 in-data-[variant=pills]:py-1",
      "in-data-[variant=pills]:text-muted-foreground",
      "in-data-[variant=pills]:data-[state=active]:bg-background in-data-[variant=pills]:data-[state=active]:text-foreground in-data-[variant=pills]:data-[state=active]:shadow-sm",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:rounded-sm",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

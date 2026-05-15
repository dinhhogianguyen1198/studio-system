"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navItems, groupNavItems } from "@/config/navigation"
import { filterNavByPermissions } from "@/components/layout/nav-filter"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Layers } from "lucide-react"
import type { RoleWithPermissions } from "@/shared/types/rbac.types"
import type { NavItem } from "@/config/navigation"

interface MobileSidebarProps {
  role: RoleWithPermissions
  appName?: string
}

export function MobileSidebar({ role, appName = "Studio" }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const filtered = filterNavByPermissions(navItems, role)
  const groups = groupNavItems(filtered)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar text-sidebar-foreground">
        <SheetHeader className="flex flex-row items-center gap-3 h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <SheetTitle className="font-semibold text-sm text-sidebar-foreground">
            {appName}
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {groups.map(({ section, items }) => (
            <div key={section}>
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                {section}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

function MobileNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate: () => void
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/")

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80"
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 truncate">{item.title}</span>
        {item.badge && (
          <span className="text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  )
}

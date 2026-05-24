"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { navItems, groupNavItems, type NavItem } from "@/config/navigation"
import { filterNavByPermissions } from "@/components/layout/nav-filter"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import Image from "next/image"
import type { RoleWithPermissions } from "@/shared/types/rbac.types"

interface SidebarProps {
  role: RoleWithPermissions
  appName?: string
}

export function Sidebar({ role, appName = "Lu Production" }: SidebarProps) {
  const { collapsed, mounted, toggle } = useSidebar()
  const pathname = usePathname()

  const filtered = filterNavByPermissions(navItems, role)
  const groups = groupNavItems(filtered)

  const isCollapsed = mounted && collapsed

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        "transition-[width] duration-200 ease-in-out shrink-0",
        isCollapsed ? "w-[52px]" : "w-[220px]"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-sidebar-border shrink-0",
          isCollapsed ? "justify-center" : "gap-2.5 px-3"
        )}
      >
        <Image
          src="/logo.png"
          alt="StudioOS"
          width={28}
          height={28}
          className="shrink-0 object-contain brightness-0"
        />
        {!isCollapsed && (
          <span className="font-semibold text-sm tracking-tight text-sidebar-foreground truncate">
            {appName}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-1.5">
        <TooltipProvider delayDuration={0}>
          <div className="space-y-4">
            {groups.map(({ section, items }, groupIndex) => (
              <div key={section}>
                {/* Section label */}
                {!isCollapsed ? (
                  <p className="px-2 mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
                    {section}
                  </p>
                ) : groupIndex > 0 ? (
                  // Divider between sections when collapsed
                  <div className="mx-auto mb-2 w-4 border-t border-sidebar-border" />
                ) : null}
                <ul className="space-y-px">
                  {items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      collapsed={isCollapsed}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-sidebar-border p-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          className={cn(
            "w-full text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            !isCollapsed && "justify-start gap-2 px-2"
          )}
          aria-label={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <>
              <PanelLeftClose className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs">Thu gọn</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
}) {
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(item.href + "/")

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors duration-100",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/65",
        collapsed && "justify-center px-0 w-full"
      )}
    >
      <item.icon
        className={cn(
          "shrink-0 w-4 h-4 transition-opacity",
          isActive ? "opacity-100" : "opacity-55 group-hover:opacity-100"
        )}
      />
      {!collapsed && (
        <span className="truncate flex-1 leading-none">{item.title}</span>
      )}
      {!collapsed && item.badge && (
        <span className="ml-auto tabular-nums text-[10px] font-semibold bg-primary/8 text-primary rounded px-1.5 py-0.5 leading-none">
          {item.badge}
        </span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.title}
            {item.badge && (
              <span className="ml-1.5 font-semibold">{item.badge}</span>
            )}
          </TooltipContent>
        </Tooltip>
      </li>
    )
  }

  return <li>{linkContent}</li>
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const SETTINGS_TABS = [
  { href: "/dashboard/settings/users", label: "Người dùng" },
  { href: "/dashboard/settings/roles", label: "Vai trò" },
  { href: "/dashboard/settings/permissions", label: "Quyền hạn" },
  {
    href: "/dashboard/settings/order-management-units",
    label: "Đơn vị đơn hàng",
  },
] as const

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-0" aria-label="Settings navigation">
        {SETTINGS_TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

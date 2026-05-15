"use client"

import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { signOut } from "next-auth/react"
import type { SessionUser } from "@/shared/types/session.types"
import type { RoleWithPermissions } from "@/shared/types/rbac.types"

interface NavbarProps {
  user: SessionUser
}

export function Navbar({ user }: NavbarProps) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() ?? "?"

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 gap-3 bg-background/90 backdrop-blur-sm border-b border-border/60 supports-[backdrop-filter]:bg-background/80">
      {/* Mobile menu trigger — rendered inside MobileSidebar */}
      <MobileSidebar role={user.role as RoleWithPermissions} />

      {/* Breadcrumb */}
      <BreadcrumbNav className="hidden sm:flex flex-1" />
      <div className="flex-1 sm:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground/70 hover:text-foreground"
          aria-label="Thông báo"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-7 rounded-full bg-muted hover:bg-accent text-foreground"
              aria-label="User menu"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name ?? "User avatar"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold">{initials}</span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold truncate">
                  {user.name ?? "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                  {(user.role as RoleWithPermissions).name}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Tổng quan",
  booking: "Booking",
  customers: "Khách hàng",
  leads: "Leads",
  finance: "Tài chính",
  production: "Sản xuất",
  admin: "Quản trị",
  users: "Người dùng",
  roles: "Vai trò",
  permissions: "Quyền hạn",
  "audit-logs": "Nhật ký hệ thống",
  settings: "Cài đặt",
  services: "Dịch vụ",
  categories: "Danh mục",
  orders: "Đơn hàng",
  new: "Tạo mới",
  edit: "Chỉnh sửa",
  workforce: "Nhân lực",
  workers: "Nhân viên",
  payroll: "Bảng lương",
  "job-types": "Loại công việc",
  "order-management-units": "Đơn vị đơn hàng",
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CUID_RE = /^c[a-z0-9]{20,}$/i

function isDynamicId(segment: string): boolean {
  return UUID_RE.test(segment) || CUID_RE.test(segment)
}

function toLabel(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  )
}

interface Crumb {
  label: string
  href: string
}

export function BreadcrumbNav({ className }: { className?: string }) {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)

  const crumbs: Crumb[] = segments
    .filter((segment) => !isDynamicId(segment))
    .map((segment, i, filtered) => ({
      label: toLabel(segment),
      href: "/" + filtered.slice(0, i + 1).join("/"),
    }))

  if (crumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-40">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-30"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

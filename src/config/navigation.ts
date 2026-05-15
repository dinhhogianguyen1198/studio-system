import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  FileText,
  UserCog,
  ShoppingCart,
  Layers,
  GitBranch,
  HardHat,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import type { Resource, Action } from "@/shared/types/rbac.types"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  /** If omitted, item is visible to all authenticated users */
  permission?: { resource: Resource; action: Action }
  children?: Omit<NavItem, "children">[]
  badge?: string
  section?: string
}

export const navItems: NavItem[] = [
  // ── Kinh doanh ────────────────────────────────────────────────────────────────
  {
    title: "Tổng quan",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "Kinh doanh",
  },
  {
    title: "Đơn hàng",
    href: "/dashboard/orders",
    icon: ShoppingCart,
    permission: { resource: "orders", action: "read" },
    section: "Kinh doanh",
  },
  {
    title: "Khách hàng",
    href: "/dashboard/customers",
    icon: Building2,
    section: "Kinh doanh",
  },



  // ── Vận hành ──────────────────────────────────────────────────────────────────
  {
    title: "Sản phẩm & Dịch vụ",
    href: "/dashboard/services",
    icon: Layers,
    permission: { resource: "service_catalog", action: "read" },
    section: "Vận hành",
  },
  {
    title: "Workflow",
    href: "/dashboard/workflow/templates",
    icon: GitBranch,
    permission: { resource: "workflow_templates", action: "read" },
    section: "Vận hành",
  },
  {
    title: "Ekip phụ trách",
    href: "/dashboard/workforce",
    icon: HardHat,
    permission: { resource: "workforce_workers", action: "read" },
    section: "Vận hành",
  },

  // ── Tài chính ─────────────────────────────────────────────────────────────────
  {
    title: "Tài chính",
    href: "/dashboard/finance",
    icon: Wallet,
    section: "Tài chính",
  },

  // ── Quản trị ──────────────────────────────────────────────────────────────────
  {
    title: "Người dùng",
    href: "/dashboard/admin/users",
    icon: Users,
    permission: { resource: "users", action: "read" },
    section: "Quản trị",
  },
  {
    title: "Vai trò",
    href: "/dashboard/admin/roles",
    icon: ShieldCheck,
    permission: { resource: "roles", action: "read" },
    section: "Quản trị",
  },
  {
    title: "Quyền hạn",
    href: "/dashboard/admin/permissions",
    icon: UserCog,
    permission: { resource: "permissions", action: "read" },
    section: "Quản trị",
  },
  {
    title: "Nhật ký",
    href: "/dashboard/admin/audit-logs",
    icon: FileText,
    permission: { resource: "audit_logs", action: "read" },
    section: "Quản trị",
  },
  {
    title: "Cài đặt",
    href: "/dashboard/settings",
    icon: Settings,
    permission: { resource: "settings", action: "read" },
    section: "Quản trị",
  },
]

/** Groups nav items by section label */
export function groupNavItems(
  items: NavItem[]
): Array<{ section: string; items: NavItem[] }> {
  const map = new Map<string, NavItem[]>()

  for (const item of items) {
    const key = item.section ?? "Kinh doanh"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }

  return Array.from(map.entries()).map(([section, items]) => ({ section, items }))
}

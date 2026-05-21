// ─── RBAC Management Types ────────────────────────────────────────────────────
// Dùng cho module quản lý User / Role / Permission trong admin UI
// Phân biệt với rbac.types.ts (session-level permission check)

import type { Resource, Action } from "@/shared/types/rbac.types"

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface UserManagementFilters {
  search?: string
  roleId?: string
  page: number
  pageSize: number
}

export interface RoleFilters {
  search?: string
  includeDeleted?: boolean
  page: number
  pageSize: number
}

export interface PermissionFilters {
  resource?: Resource
  action?: Action
  page: number
  pageSize: number
}

// ─── User management ──────────────────────────────────────────────────────────

export interface UserSummary {
  id: string
  email: string
  name: string | null
  image: string | null
  role: {
    id: string
    name: string
    isSystem: boolean
  }
  userRoles: Array<{
    id: string
    role: { id: string; name: string; isSystem: boolean }
    assignedAt: string
    assignedBy: { id: string; name: string | null }
  }>
  createdAt: string
}

export interface UserDetail extends UserSummary {
  emailVerified: string | null
  updatedAt: string
}

// ─── Role management ──────────────────────────────────────────────────────────

export interface RoleSummary {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  _count: { users: number; userRoles: number; permissions: number }
  createdAt: string
  deletedAt: string | null
}

export interface RoleDetail extends RoleSummary {
  permissions: Array<{
    permission: {
      id: string
      action: string
      resource: string
      description: string | null
    }
    assignedAt: string
  }>
  createdBy: { id: string; name: string | null } | null
  updatedBy: { id: string; name: string | null } | null
  updatedAt: string
}

// ─── Permission management ────────────────────────────────────────────────────

export interface PermissionSummary {
  id: string
  action: string
  resource: string
  description: string | null
  _count: { roles: number }
}

export interface PermissionGroup {
  resource: Resource
  permissions: PermissionSummary[]
}

// ─── Error codes ──────────────────────────────────────────────────────────────

export type RbacErrorCode =
  | "USER_NOT_FOUND"
  | "ROLE_NOT_FOUND"
  | "PERMISSION_NOT_FOUND"
  | "ROLE_ALREADY_EXISTS"
  | "ROLE_IS_SYSTEM"
  | "USER_ALREADY_HAS_ROLE"
  | "USER_DOES_NOT_HAVE_ROLE"
  | "ROLE_ALREADY_HAS_PERMISSION"
  | "ROLE_DOES_NOT_HAVE_PERMISSION"
  | "CANNOT_DELETE_PRIMARY_ROLE"
  | "CANNOT_CHANGE_OWN_ROLE"
  | "DUPLICATE_EMAIL"
  | "UNKNOWN"

export interface RbacError {
  code: RbacErrorCode
  message: string
}

export const RBAC_ERROR_MESSAGES: Record<RbacErrorCode, string> = {
  USER_NOT_FOUND: "Không tìm thấy người dùng",
  ROLE_NOT_FOUND: "Không tìm thấy vai trò",
  PERMISSION_NOT_FOUND: "Không tìm thấy quyền",
  ROLE_ALREADY_EXISTS: "Tên vai trò đã tồn tại",
  ROLE_IS_SYSTEM: "Không thể xóa vai trò hệ thống",
  USER_ALREADY_HAS_ROLE: "Người dùng đã có vai trò này",
  USER_DOES_NOT_HAVE_ROLE: "Người dùng không có vai trò này",
  ROLE_ALREADY_HAS_PERMISSION: "Vai trò đã có quyền này",
  ROLE_DOES_NOT_HAVE_PERMISSION: "Vai trò không có quyền này",
  CANNOT_DELETE_PRIMARY_ROLE: "Không thể xóa vai trò chính của người dùng",
  CANNOT_CHANGE_OWN_ROLE: "Không thể thay đổi vai trò của chính mình",
  DUPLICATE_EMAIL: "Email đã được sử dụng",
  UNKNOWN: "Đã xảy ra lỗi không xác định",
}

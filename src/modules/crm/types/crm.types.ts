// ─── Enums (mirror Prisma enums) ──────────────────────────────────────────────

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLOCKED"

export type CustomerSource =
  | "DIRECT"
  | "REFERRAL"
  | "SOCIAL_MEDIA"
  | "WEBSITE"
  | "EVENT"
  | "OTHER"
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface CustomerSummary {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  status: CustomerStatus
  source: CustomerSource
  tags: string[]
  _count: { notes: number }
  createdAt: Date
}

export interface CustomerDetail extends CustomerSummary {
  createdBy: { id: string; name: string | null; email: string }
  notes: CustomerNoteRow[]
  leads: LeadSummary[]
  updatedAt: Date
}

export interface LeadSummary {
  id: string
  title: string
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  value: string | null
  currency: string
  status: LeadStatus
  priority: LeadPriority
  source: CustomerSource
  customer: { id: string; name: string } | null
  assignedTo: { id: string; name: string | null; email: string } | null
  expectedCloseDate: Date | null
  createdAt: Date
}

export interface LeadDetail extends LeadSummary {
  createdBy: { id: string; name: string | null; email: string }
  notes: LeadNoteRow[]
  closedAt: Date | null
  updatedAt: Date
}

export interface CustomerNoteRow {
  id: string
  content: string
  author: { id: string; name: string | null; email: string }
  createdAt: Date
  updatedAt: Date
}

export interface LeadNoteRow {
  id: string
  content: string
  author: { id: string; name: string | null; email: string }
  createdAt: Date
  updatedAt: Date
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface CustomerFilters {
  search?: string
  page?: number
  pageSize?: number
}

export interface LeadFilters {
  search?: string
  status?: LeadStatus
  priority?: LeadPriority
  source?: CustomerSource
  assignedToId?: string
  customerId?: string
  page?: number
  pageSize?: number
}

// ─── Error codes ──────────────────────────────────────────────────────────────

export type CrmErrorCode =
  | "CUSTOMER_NOT_FOUND"
  | "LEAD_NOT_FOUND"
  | "NOTE_NOT_FOUND"
  | "DUPLICATE_EMAIL"
  | "FORBIDDEN"
  | "UNKNOWN"

export interface CrmError {
  code: CrmErrorCode
  message: string
}

// ─── Label maps ───────────────────────────────────────────────────────────────

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Không hoạt động",
  BLOCKED: "Bị chặn",
}

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  DIRECT: "Trực tiếp",
  REFERRAL: "Giới thiệu",
  SOCIAL_MEDIA: "Mạng xã hội",
  WEBSITE: "Website",
  EVENT: "Sự kiện",
  OTHER: "Khác",
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  QUALIFIED: "Đủ điều kiện",
  PROPOSAL: "Đề xuất",
  NEGOTIATION: "Đàm phán",
  WON: "Thành công",
  LOST: "Thất bại",
}

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
}

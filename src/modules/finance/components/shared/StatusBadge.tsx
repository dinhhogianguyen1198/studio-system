import { Badge } from "@/components/ui/badge"
import type { ExpenseStatus, InvoiceStatus, FreelancerPaymentStatus } from "@prisma/client"

const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
}

const EXPENSE_STATUS_VARIANTS: Record<
  ExpenseStatus,
  "muted" | "warning" | "destructive" | "success"
> = {
  PENDING: "warning",
  APPROVED: "muted",
  REJECTED: "destructive",
  PAID: "success",
  CANCELLED: "destructive",
}

const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Nháp",
  SENT: "Đã gửi",
  PARTIAL: "Trả một phần",
  PAID: "Đã thanh toán",
  OVERDUE: "Quá hạn",
  CANCELLED: "Đã hủy",
}

const INVOICE_STATUS_VARIANTS: Record<
  InvoiceStatus,
  "muted" | "warning" | "destructive" | "success"
> = {
  DRAFT: "muted",
  SENT: "muted",
  PARTIAL: "warning",
  PAID: "success",
  OVERDUE: "destructive",
  CANCELLED: "destructive",
}

const FREELANCER_PAYMENT_STATUS_LABELS: Record<FreelancerPaymentStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
}

const FREELANCER_PAYMENT_STATUS_VARIANTS: Record<
  FreelancerPaymentStatus,
  "muted" | "warning" | "destructive" | "success"
> = {
  PENDING: "warning",
  PROCESSING: "muted",
  PAID: "success",
  CANCELLED: "destructive",
}

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <Badge variant={EXPENSE_STATUS_VARIANTS[status]}>
      {EXPENSE_STATUS_LABELS[status]}
    </Badge>
  )
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant={INVOICE_STATUS_VARIANTS[status]}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  )
}

export function FreelancerPaymentStatusBadge({ status }: { status: FreelancerPaymentStatus }) {
  return (
    <Badge variant={FREELANCER_PAYMENT_STATUS_VARIANTS[status]}>
      {FREELANCER_PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

import { z } from "zod"

// ─── Expense ─────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(255),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  orderId: z.string().optional(),
  expenseDate: z.string().min(1, "Vui lòng chọn ngày chi"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string().min(1),
})

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

export const approveExpenseSchema = z.object({
  id: z.string().min(1),
})

export const rejectExpenseSchema = z.object({
  id: z.string().min(1),
  reason: z.string().optional(),
})

export const markExpensePaidSchema = z.object({
  id: z.string().min(1),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]),
  reference: z.string().optional(),
  paidAt: z.string().optional(),
})

// ─── Expense Category ─────────────────────────────────────────────────────────

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống").max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
})

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>

// ─── Invoice ─────────────────────────────────────────────────────────────────

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Mô tả không được để trống"),
  quantity: z.coerce.number().positive("Số lượng phải lớn hơn 0"),
  unitPrice: z.coerce.number().positive("Đơn giá phải lớn hơn 0"),
  sortOrder: z.coerce.number().int().default(0),
})

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>

export const createInvoiceSchema = z.object({
  orderId: z.string().optional(),
  customerId: z.string().optional(),
  dueDate: z.string().min(1, "Vui lòng chọn hạn thanh toán"),
  discountAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Phải có ít nhất 1 dịch vụ"),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

export const updateInvoiceSchema = z.object({
  id: z.string().min(1),
  dueDate: z.string().optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1).optional(),
})

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>

export const sendInvoiceSchema = z.object({
  id: z.string().min(1),
})

export const cancelInvoiceSchema = z.object({
  id: z.string().min(1),
  reason: z.string().optional(),
})

// ─── Freelancer Payment ───────────────────────────────────────────────────────

export const createFreelancerPaymentSchema = z.object({
  workerId: z.string().min(1, "Vui lòng chọn nhân viên"),
  periodStart: z.string().min(1, "Vui lòng chọn từ ngày"),
  periodEnd: z.string().min(1, "Vui lòng chọn đến ngày"),
  assignmentIds: z.array(z.string()).min(1, "Phải chọn ít nhất 1 công việc"),
  notes: z.string().optional(),
})

export type CreateFreelancerPaymentInput = z.infer<typeof createFreelancerPaymentSchema>

export const processFreelancerPaymentSchema = z.object({
  id: z.string().min(1),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]),
  reference: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
})

export type ProcessFreelancerPaymentInput = z.infer<typeof processFreelancerPaymentSchema>

// ─── Financial Account ────────────────────────────────────────────────────────

export const createFinancialAccountSchema = z.object({
  name: z.string().min(1, "Tên tài khoản không được để trống").max(100),
  type: z.enum(["CASH", "BANK", "E_WALLET", "OTHER"]),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  balance: z.coerce.number().default(0),
  currency: z.string().default("VND"),
  notes: z.string().optional(),
})

export type CreateFinancialAccountInput = z.infer<typeof createFinancialAccountSchema>

// ─── Shared filter schemas ────────────────────────────────────────────────────

export const expenseFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID", "CANCELLED"]).optional(),
  orderId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>

export const invoiceFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  customerId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>

export const freelancerPaymentFiltersSchema = z.object({
  workerId: z.string().optional(),
  status: z.enum(["PENDING", "PROCESSING", "PAID", "CANCELLED"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type FreelancerPaymentFilters = z.infer<typeof freelancerPaymentFiltersSchema>

export const financialReportFiltersSchema = z.object({
  from: z.string().min(1, "Vui lòng chọn từ ngày"),
  to: z.string().min(1, "Vui lòng chọn đến ngày"),
  groupBy: z.enum(["day", "week", "month"]).default("month"),
})

export type FinancialReportFilters = z.infer<typeof financialReportFiltersSchema>

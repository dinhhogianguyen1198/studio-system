import type { Prisma } from "@prisma/client"

// ─── Expense selects ──────────────────────────────────────────────────────────

export const expenseSummarySelect = {
  id: true,
  title: true,
  amount: true,
  currency: true,
  expenseDate: true,
  status: true,
  paymentMethod: true,
  reference: true,
  notes: true,
  createdAt: true,
  category: { select: { id: true, name: true, color: true } },
  order: { select: { id: true, orderNumber: true } },
  createdBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  approvedAt: true,
} satisfies Prisma.ExpenseSelect

export type ExpenseSummary = Prisma.ExpenseGetPayload<{ select: typeof expenseSummarySelect }>

export const expenseCategorySummarySelect = {
  id: true,
  name: true,
  slug: true,
  color: true,
  description: true,
  parentId: true,
  isActive: true,
  sortOrder: true,
  _count: { select: { expenses: true } },
} satisfies Prisma.ExpenseCategorySelect

export type ExpenseCategorySummary = Prisma.ExpenseCategoryGetPayload<{
  select: typeof expenseCategorySummarySelect
}>

// ─── Invoice selects ──────────────────────────────────────────────────────────

export const invoiceSummarySelect = {
  id: true,
  invoiceNumber: true,
  status: true,
  issueDate: true,
  dueDate: true,
  subtotal: true,
  discountAmount: true,
  taxAmount: true,
  totalAmount: true,
  paidAmount: true,
  currency: true,
  sentAt: true,
  paidAt: true,
  createdAt: true,
  order: { select: { id: true, orderNumber: true } },
  customer: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.InvoiceSelect

export type InvoiceSummary = Prisma.InvoiceGetPayload<{ select: typeof invoiceSummarySelect }>

export const invoiceDetailSelect = {
  ...invoiceSummarySelect,
  notes: true,
  terms: true,
  cancelledAt: true,
  items: {
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.InvoiceSelect

export type InvoiceDetail = Prisma.InvoiceGetPayload<{ select: typeof invoiceDetailSelect }>

// ─── Freelancer Payment selects ───────────────────────────────────────────────

export const freelancerPaymentSummarySelect = {
  id: true,
  periodStart: true,
  periodEnd: true,
  totalAmount: true,
  currency: true,
  status: true,
  paymentMethod: true,
  reference: true,
  notes: true,
  paidAt: true,
  createdAt: true,
  worker: { select: { id: true, name: true, email: true } },
  paidBy: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} satisfies Prisma.FreelancerPaymentSelect

export type FreelancerPaymentSummary = Prisma.FreelancerPaymentGetPayload<{
  select: typeof freelancerPaymentSummarySelect
}>

export const freelancerPaymentDetailSelect = {
  ...freelancerPaymentSummarySelect,
  items: {
    select: {
      id: true,
      amount: true,
      orderItemWorker: {
        select: {
          id: true,
          workerNameSnapshot: true,
          jobTypeNameSnapshot: true,
          rateTypeSnapshot: true,
          rateAmountSnapshot: true,
          quantity: true,
          totalCost: true,
          orderItem: {
            select: {
              id: true,
              name: true,
              order: { select: { id: true, orderNumber: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.FreelancerPaymentSelect

export type FreelancerPaymentDetail = Prisma.FreelancerPaymentGetPayload<{
  select: typeof freelancerPaymentDetailSelect
}>

// ─── Unpaid assignment (for payroll dialog) ───────────────────────────────────

export interface UnpaidAssignment {
  id: string
  workerNameSnapshot: string
  jobTypeNameSnapshot: string
  rateTypeSnapshot: string
  rateAmountSnapshot: { toNumber: () => number }
  quantity: { toNumber: () => number }
  totalCost: { toNumber: () => number }
  completedAt: Date | null
  orderItem: {
    id: string
    name: string
    order: { id: string; orderNumber: string }
  }
}

// ─── Financial Account selects ────────────────────────────────────────────────

export const financialAccountSelect = {
  id: true,
  name: true,
  type: true,
  bankName: true,
  accountNumber: true,
  balance: true,
  currency: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FinancialAccountSelect

export type FinancialAccount = Prisma.FinancialAccountGetPayload<{
  select: typeof financialAccountSelect
}>

// ─── Dashboard / Report types ─────────────────────────────────────────────────

export interface FinancialKpi {
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  grossMargin: number
  totalWorkerCosts: number
  netProfit: number
  netMargin: number
  outstandingReceivables: number
  pendingPayables: number
  overdueInvoicesCount: number
  unpaidFreelancerCount: number
}

export interface RevenueExpenseDataPoint {
  period: string
  revenue: number
  expenses: number
  workerCosts: number
  profit: number
}

export interface OrderProfitReport {
  orderId: string
  orderNumber: string
  customerName: string
  revenue: number
  workerCosts: number
  directExpenses: number
  grossProfit: number
  grossMargin: number
}

export interface TopServiceProfit {
  serviceId: string
  serviceName: string
  revenue: number
  count: number
  averageRevenue: number
}

export interface ExpenseBreakdown {
  categoryId: string
  categoryName: string
  categoryColor: string
  total: number
  percentage: number
}

export interface CashflowPoint {
  date: string
  inflow: number
  outflow: number
  net: number
}

import { financeReportRepository } from "../repository/finance-report.repository"
import type {
  FinancialKpi,
  RevenueExpenseDataPoint,
  OrderProfitReport,
  TopServiceProfit,
  ExpenseBreakdown,
} from "../types/finance.types"

export const financeReportService = {
  async getKpi(from: string, to: string): Promise<FinancialKpi> {
    return financeReportRepository.getKpi(new Date(from), new Date(to))
  },

  async getRevenueExpenseTrend(
    from: string,
    to: string,
    groupBy: "day" | "week" | "month" = "month",
  ): Promise<RevenueExpenseDataPoint[]> {
    return financeReportRepository.getRevenueExpenseTrend(
      new Date(from),
      new Date(to),
      groupBy,
    )
  },

  async getOrderProfitReport(from: string, to: string): Promise<OrderProfitReport[]> {
    return financeReportRepository.getOrderProfitReport(new Date(from), new Date(to))
  },

  async getTopServices(from: string, to: string): Promise<TopServiceProfit[]> {
    return financeReportRepository.getTopServices(new Date(from), new Date(to))
  },

  async getExpenseBreakdown(from: string, to: string): Promise<ExpenseBreakdown[]> {
    return financeReportRepository.getExpenseBreakdown(new Date(from), new Date(to))
  },
}

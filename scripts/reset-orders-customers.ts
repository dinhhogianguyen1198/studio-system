/**
 * reset-orders-customers.ts
 *
 * Xóa toàn bộ Orders, Invoices, Leads, Customers theo đúng thứ tự FK.
 * Chỉ chạy từ reset-orders-customers.sh — không chạy trực tiếp.
 *
 * Thứ tự xóa:
 *   1. orders          → cascade: order_items, order_item_workflow_logs,
 *                                 order_item_workers, order_payments,
 *                                 order_feedbacks, order_incidental_costs
 *                        set null: expenses.orderId, invoices.orderId
 *   2. invoices        → cascade: invoice_items
 *                        set null: (customers đã xóa ở bước 4)
 *   3. leads           → cascade: lead_notes
 *   4. customers       → cascade: customer_notes
 */

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient({
  log: ["error"],
})

async function main(): Promise<void> {
  await db.$transaction(
    async (tx) => {
      // ── 1. Orders (và tất cả cascade) ─────────────────────────────────────
      process.stdout.write("  Xóa orders... ")
      const { count: deletedOrders } = await tx.order.deleteMany({})
      console.log(`${deletedOrders} bản ghi`)

      // ── 2. Invoices (orderId đã là NULL sau bước 1) ───────────────────────
      process.stdout.write("  Xóa invoices... ")
      const { count: deletedInvoices } = await tx.invoice.deleteMany({})
      console.log(`${deletedInvoices} bản ghi`)

      // ── 3. Leads (cascade: lead_notes) ────────────────────────────────────
      process.stdout.write("  Xóa leads... ")
      const { count: deletedLeads } = await tx.lead.deleteMany({})
      console.log(`${deletedLeads} bản ghi`)

      // ── 4. Customers (cascade: customer_notes) ────────────────────────────
      process.stdout.write("  Xóa customers... ")
      const { count: deletedCustomers } = await tx.customer.deleteMany({})
      console.log(`${deletedCustomers} bản ghi`)
    },
    {
      maxWait: 30_000,
      timeout: 120_000,
    },
  )
}

main()
  .catch((err) => {
    console.error("\nLỗi khi xóa dữ liệu:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

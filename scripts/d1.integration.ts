import { beforeAll, afterAll, describe, it, expect } from "vitest"
import { getPlatformProxy } from "wrangler"
import { readFile, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { D1Database } from "@cloudflare/workers-types"
import { db } from "../src/shared/lib/prisma"
import { atomicBatch, insertRow, createId } from "../src/shared/lib/d1"
import { orderService } from "../src/modules/orders/service/order.service"
import { financeReportRepository } from "../src/modules/finance/repository/finance-report.repository"
import { dashboardRepository } from "../src/modules/dashboard/repository/dashboard.repository"
import { expenseRepository } from "../src/modules/finance/repository/expense.repository"
import { invoiceRepository } from "../src/modules/finance/repository/invoice.repository"
import { rbacRoleRepository } from "../src/modules/rbac/repository/rbac-role.repository"
import { customerRepository } from "../src/modules/crm/repository/customer.repository"
import { workerRepository } from "../src/modules/workforce/repository/worker.repository"
import { freelancerPaymentRepository } from "../src/modules/finance/repository/freelancer-payment.repository"
import { Prisma } from "@prisma/client"

let platform: Awaited<ReturnType<typeof getPlatformProxy<{ DB: D1Database }>>>
let directory: string
const roleId = createId()
const userId = createId()
const from = new Date("2000-01-01T00:00:00Z")
const to = new Date("2100-01-01T00:00:00Z")

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "studio-d1-"))
  platform = await getPlatformProxy<{ DB: D1Database }>({
    persist: { path: directory },
  })
  globalThis.studioD1 = platform.env.DB
  const sql = await readFile("prisma/d1-migrations/0001_initial.sql", "utf8")
  const statements = sql
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
  for (let i = 0; i < statements.length; i += 50) {
    await platform.env.DB.batch(
      statements.slice(i, i + 50).map((sql) => platform.env.DB.prepare(sql)),
    )
  }
  await db.role.create({
    data: { id: roleId, name: "integration-owner", isSystem: true },
  })
  await db.user.create({
    data: {
      id: userId,
      roleId,
      email: "integration@example.test",
      name: "Integration",
    },
  })
})
afterAll(async () => {
  globalThis.studioD1 = undefined
  await platform?.dispose()
  if (directory) await rm(directory, { recursive: true, force: true })
})

describe("D1 integration", () => {
  it("stores Prisma decimals and JSON lists, reads customer tags", async () => {
    const customer = await customerRepository.create({
      name: "D1 Customer",
      createdById: userId,
    })
    expect((await customerRepository.findById(customer.id))?.tags).toEqual([])
    await db.customer.update({
      where: { id: customer.id },
      data: { tags: ["vip", "studio"] },
    })
    expect((await customerRepository.findById(customer.id))?.tags).toEqual([
      "vip",
      "studio",
    ])
    const service = await db.serviceDefinition.create({
      data: {
        name: "D1 Photo",
        slug: "d1-photo",
        defaultPrice: new Prisma.Decimal("1234.56"),
        createdById: userId,
      },
    })
    expect(service.defaultPrice.toString()).toBe("1234.56")
  })

  it("allocates distinct order numbers under concurrent requests", async () => {
    const orders = await Promise.all(
      Array.from({ length: 8 }, () =>
        orderService.create(
          {
            contactName: "D1 Test",
            discountAmount: 0,
          },
          userId,
        ),
      ),
    )
    expect(new Set(orders.map((order) => order.orderNumber)).size).toBe(8)
    expect(orders[0].orderNumber).toMatch(/^ORD-\d{4}-\d{4}$/)
  })

  it("rolls back an entire D1 batch when a foreign key fails", async () => {
    const id = createId()
    await expect(
      atomicBatch([
        insertRow("roles", {
          id,
          name: "rollback-role",
          updatedAt: new Date(),
        }),
        insertRow("users", {
          id: createId(),
          email: "broken@example.test",
          roleId: "missing-role",
          updatedAt: new Date(),
        }),
      ]),
    ).rejects.toThrow()
    expect(await db.role.findUnique({ where: { id } })).toBeNull()
  })

  it("replaces permissions atomically and preserves them on failure", async () => {
    const permission = await db.permission.create({
      data: { action: "read", resource: "integration" },
    })
    await rbacRoleRepository.replacePermissions(roleId, [permission.id], userId)
    await expect(
      rbacRoleRepository.replacePermissions(
        roleId,
        ["missing-permission"],
        userId,
      ),
    ).rejects.toThrow()
    expect(await db.rolePermission.count({ where: { roleId } })).toBe(1)
  })

  it("creates and replaces invoice items with exact decimal reads and rollback", async () => {
    const invoice = await invoiceRepository.create({
      invoiceNumber: await invoiceRepository.generateInvoiceNumber(),
      dueDate: new Date(),
      subtotal: new Prisma.Decimal("123.45"),
      totalAmount: new Prisma.Decimal("123.45"),
      discountAmount: new Prisma.Decimal(0),
      taxAmount: new Prisma.Decimal(0),
      createdById: userId,
      items: [
        {
          description: "Photo",
          quantity: new Prisma.Decimal(1),
          unitPrice: new Prisma.Decimal("123.45"),
          totalPrice: new Prisma.Decimal("123.45"),
          sortOrder: 0,
        },
      ],
    })
    expect(invoice.items).toHaveLength(1)
    expect(invoice.totalAmount.toString()).toBe("123.45")
    await expect(
      invoiceRepository.replaceItems(invoice.id, [
        {
          description: null as unknown as string,
          quantity: new Prisma.Decimal(1),
          unitPrice: new Prisma.Decimal(10),
          totalPrice: new Prisma.Decimal(10),
          sortOrder: 0,
        },
      ]),
    ).rejects.toThrow()
    expect((await invoiceRepository.findById(invoice.id))?.items).toHaveLength(
      1,
    )
    await invoiceRepository.replaceItems(invoice.id, [])
    expect((await invoiceRepository.findById(invoice.id))?.items).toHaveLength(
      0,
    )
  })

  it("runs every SQLite finance and dashboard report", async () => {
    const order = await orderService.create(
      { contactName: "Report", discountAmount: 0 },
      userId,
    )
    await db.orderPayment.create({
      data: {
        orderId: order.id,
        amount: new Prisma.Decimal("42.25"),
        recordedById: userId,
      },
    })
    const category = await db.expenseCategory.create({
      data: { name: "Test", slug: "test" },
    })
    await db.expense.create({
      data: {
        title: "Test cost",
        amount: new Prisma.Decimal("2.25"),
        categoryId: category.id,
        expenseDate: new Date(),
        status: "PAID",
        createdById: userId,
      },
    })
    const kpi = await financeReportRepository.getKpi(from, to)
    expect(kpi.totalRevenue).toBe(42.25)
    expect(kpi.totalExpenses).toBe(2.25)
    for (const period of ["day", "week", "month"] as const) {
      const rows = await financeReportRepository.getRevenueExpenseTrend(
        from,
        to,
        period,
      )
      expect(rows.reduce((sum, row) => sum + row.revenue, 0)).toBe(42.25)
      expect(rows.every((row) => typeof row.period === "string")).toBe(true)
    }
    await financeReportRepository.getOrderProfitReport(from, to)
    await financeReportRepository.getTopServices(from, to)
    await financeReportRepository.getExpenseBreakdown(from, to)
    expect((await expenseRepository.sumByStatus(from, to))[0].amount).toBe(2.25)
    expect((await expenseRepository.sumByCategory(from, to))[0].amount).toBe(
      2.25,
    )
    await invoiceRepository.sumPaidByMonth(from, to)
    await dashboardRepository.getUnpaidStats()
    await dashboardRepository.getUnpaidByUnit()
    await dashboardRepository.getAlerts()
    expect(
      (await dashboardRepository.getDailyRevenue(2)).reduce(
        (sum, row) => sum + row.revenue,
        0,
      ),
    ).toBe(42.25)
  })

  it("creates worker relations and pays freelancers through D1 batches", async () => {
    const job = await db.jobType.create({
      data: { name: "Photo", slug: "photo", createdById: userId },
    })
    const worker = await workerRepository.create(
      {
        name: "Worker",
        jobTypeIds: [job.id],
        primaryJobTypeId: job.id,
        isActive: true,
      },
      userId,
    )
    expect(worker.jobTypes).toHaveLength(1)
    await workerRepository.update({
      id: worker.id,
      jobTypeIds: [],
      name: "Updated",
    })
    expect((await workerRepository.findById(worker.id))?.jobTypes).toHaveLength(
      0,
    )
    const payment = await freelancerPaymentRepository.create({
      workerId: worker.id,
      periodStart: from,
      periodEnd: to,
      totalAmount: new Prisma.Decimal(0),
      createdById: userId,
      items: [],
    })
    expect(
      (
        await freelancerPaymentRepository.markPaid(payment.id, {
          paymentMethod: "CASH",
          paidAt: new Date(),
          paidById: userId,
        })
      ).status,
    ).toBe("PAID")
  })
})

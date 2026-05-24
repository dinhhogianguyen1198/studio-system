/**
 * Script tạo test data tạm thời — KHÔNG phải migration.
 * Chạy: npx tsx prisma/seed-test-data.ts
 * Xóa: npx tsx prisma/seed-test-data.ts --clean
 */

import { Prisma } from "@prisma/client"
import { db } from "./client"

const IS_CLEAN = process.argv.includes("--clean")

// ─── Dữ liệu cố định ────────────────────────────────────────────────────────

const JOB_TYPES = [
  { name: "Nhiếp ảnh gia",      slug: "photographer",     color: "#3B82F6", sortOrder: 1 },
  { name: "Quay phim",           slug: "videographer",     color: "#8B5CF6", sortOrder: 2 },
  { name: "Biên tập ảnh",        slug: "photo-editor",     color: "#10B981", sortOrder: 3 },
  { name: "Biên tập video",      slug: "video-editor",     color: "#F59E0B", sortOrder: 4 },
  { name: "Motion Graphics",     slug: "motion-designer",  color: "#EF4444", sortOrder: 5 },
  { name: "Âm thanh / MC",       slug: "sound-engineer",   color: "#06B6D4", sortOrder: 6 },
]

const SERVICES = [
  { name: "Chụp ảnh cưới",         slug: "wedding-photo",     defaultPrice: 8_000_000,  defaultDurationDays: 1 },
  { name: "Quay phim cưới",        slug: "wedding-video",     defaultPrice: 12_000_000, defaultDurationDays: 1 },
  { name: "Edit ảnh cưới",         slug: "wedding-photo-edit", defaultPrice: 3_000_000, defaultDurationDays: 5 },
  { name: "Edit video cưới",       slug: "wedding-video-edit", defaultPrice: 5_000_000, defaultDurationDays: 7 },
  { name: "Chụp ảnh sự kiện",      slug: "event-photo",       defaultPrice: 4_000_000,  defaultDurationDays: 1 },
  { name: "Quay phim sự kiện",     slug: "event-video",       defaultPrice: 6_000_000,  defaultDurationDays: 1 },
  { name: "Chụp ảnh thương mại",   slug: "commercial-photo",  defaultPrice: 10_000_000, defaultDurationDays: 2 },
  { name: "Motion Graphics / MV",  slug: "motion-mv",         defaultPrice: 15_000_000, defaultDurationDays: 14 },
]

const WORKERS = [
  {
    name: "Nguyễn Văn An",    phone: "0901 111 001", email: "an.nguyen@studio.vn",
    jobTypes: ["photographer", "photo-editor"],       primary: "photographer",
    rates: [
      { jobSlug: "photographer",  rateType: "PER_JOB", amount: 1_500_000 },
      { jobSlug: "photo-editor",  rateType: "PER_JOB", amount: 800_000  },
    ],
  },
  {
    name: "Trần Thị Bảo",     phone: "0901 111 002", email: "bao.tran@studio.vn",
    jobTypes: ["videographer", "video-editor"],       primary: "videographer",
    rates: [
      { jobSlug: "videographer",  rateType: "PER_JOB", amount: 2_000_000 },
      { jobSlug: "video-editor",  rateType: "PER_JOB", amount: 1_200_000 },
    ],
  },
  {
    name: "Lê Hoàng Cường",   phone: "0901 111 003", email: "cuong.le@studio.vn",
    jobTypes: ["photographer"],                        primary: "photographer",
    rates: [
      { jobSlug: "photographer",  rateType: "PER_JOB", amount: 1_200_000 },
    ],
  },
  {
    name: "Phạm Minh Duy",    phone: "0901 111 004", email: "duy.pham@studio.vn",
    jobTypes: ["video-editor", "motion-designer"],    primary: "video-editor",
    rates: [
      { jobSlug: "video-editor",   rateType: "PER_JOB", amount: 1_000_000 },
      { jobSlug: "motion-designer",rateType: "PER_JOB", amount: 1_800_000 },
    ],
  },
  {
    name: "Võ Thị Ê",         phone: "0901 111 005", email: "e.vo@studio.vn",
    jobTypes: ["photo-editor"],                        primary: "photo-editor",
    rates: [
      { jobSlug: "photo-editor",  rateType: "PER_JOB", amount: 700_000 },
    ],
  },
  {
    name: "Đinh Quốc Phong",  phone: "0901 111 006", email: "phong.dinh@studio.vn",
    jobTypes: ["sound-engineer"],                      primary: "sound-engineer",
    rates: [
      { jobSlug: "sound-engineer", rateType: "PER_JOB", amount: 1_000_000 },
    ],
  },
]

const CUSTOMERS = [
  { name: "Nguyễn Hoàng Nam & Lê Thị Hoa", phone: "0909 200 001", email: "nam.hoa@gmail.com",   source: "REFERRAL"    as const },
  { name: "Trần Văn Khoa",                  phone: "0909 200 002", email: "khoa.tran@gmail.com",  source: "SOCIAL_MEDIA"as const },
  { name: "Công ty TNHH Ánh Sáng Mới",     phone: "0909 200 003", email: "contact@anhsangmoi.vn",source: "DIRECT"      as const },
  { name: "Phạm Thu Hằng",                  phone: "0909 200 004", email: "hang.pham@gmail.com",  source: "REFERRAL"    as const },
  { name: "Lê Đình Bách & Võ Thanh Mai",   phone: "0909 200 005", email: "bach.mai@gmail.com",   source: "WEBSITE"     as const },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function clean() {
  console.log("🧹 Đang xóa test data...")
  // Xóa theo thứ tự để tránh vi phạm foreign key
  await db.orderItemWorker.deleteMany({})
  await db.orderItem.deleteMany({})
  await db.orderPayment.deleteMany({})
  await db.orderFeedback.deleteMany({})
  await db.orderIncidentalCost.deleteMany({})
  await db.order.deleteMany({})
  await db.workerRate.deleteMany({})
  await db.workerJobType.deleteMany({})
  await db.worker.deleteMany({})
  await db.serviceDefinition.deleteMany({})
  await db.jobType.deleteMany({})
  await db.customer.deleteMany({})
  console.log("✓ Đã xóa xong\n")
}

async function main() {
  if (IS_CLEAN) {
    await clean()
    return
  }

  console.log("🌱 Bắt đầu tạo test data...\n")

  // ── 1. Lấy admin user để làm createdById ──────────────────────────────────
  const admin = await db.user.findFirst({ where: { email: "admin@example.com" } })
  if (!admin) throw new Error("Không tìm thấy admin user. Hãy chạy `npm run seed` trước.")

  // ── 2. Job types ──────────────────────────────────────────────────────────
  console.log("Tạo job types...")
  const jobTypeMap = new Map<string, string>() // slug → id

  for (const jt of JOB_TYPES) {
    const record = await db.jobType.upsert({
      where: { slug: jt.slug },
      update: {},
      create: { ...jt, createdById: admin.id },
    })
    jobTypeMap.set(jt.slug, record.id)
    console.log(`  ✓ ${jt.name}`)
  }

  // ── 3. Service definitions ────────────────────────────────────────────────
  console.log("\nTạo service definitions...")
  const serviceMap = new Map<string, string>() // slug → id

  for (const svc of SERVICES) {
    const record = await db.serviceDefinition.upsert({
      where: { slug: svc.slug },
      update: {},
      create: {
        name: svc.name,
        slug: svc.slug,
        defaultPrice: new Prisma.Decimal(svc.defaultPrice),
        defaultDurationDays: svc.defaultDurationDays,
        isActive: true,
        createdById: admin.id,
      },
    })
    serviceMap.set(svc.slug, record.id)
    console.log(`  ✓ ${svc.name}`)
  }

  // ── 4. Workers + rates ────────────────────────────────────────────────────
  console.log("\nTạo workers...")
  const workerMap = new Map<string, string>() // name → id

  for (const w of WORKERS) {
    const worker = await db.worker.create({
      data: {
        name: w.name,
        phone: w.phone,
        email: w.email,
        isActive: true,
        createdById: admin.id,
        jobTypes: {
          create: w.jobTypes.map((slug) => ({
            jobTypeId: jobTypeMap.get(slug)!,
            isPrimary: slug === w.primary,
          })),
        },
      },
    })
    workerMap.set(w.name, worker.id)

    for (const rate of w.rates) {
      await db.workerRate.create({
        data: {
          workerId: worker.id,
          jobTypeId: jobTypeMap.get(rate.jobSlug)!,
          rateType: rate.rateType as "PER_JOB" | "HOURLY" | "DAILY",
          amount: new Prisma.Decimal(rate.amount),
          currency: "VND",
          isActive: true,
          effectiveFrom: new Date("2025-01-01"),
        },
      })
    }
    console.log(`  ✓ ${w.name} (${w.jobTypes.join(", ")})`)
  }

  // ── 5. Customers ──────────────────────────────────────────────────────────
  console.log("\nTạo customers...")
  const customerMap = new Map<string, string>() // name → id

  for (const c of CUSTOMERS) {
    const record = await db.customer.create({
      data: { ...c, status: "ACTIVE", createdById: admin.id },
    })
    customerMap.set(c.name, record.id)
    console.log(`  ✓ ${c.name}`)
  }

  // ── 6. Orders + items + assignments ──────────────────────────────────────
  console.log("\nTạo orders, items & assignments...")

  type OrderSpec = {
    customer: string
    contactName: string
    status: "NEW" | "WAITING_FILES" | "PARTIAL_DELIVERY" | "FILES_DELIVERED" | "COMPLETED"
    items: {
      serviceSlug: string
      name: string
      price: number
      quantity?: number
      assignments: {
        workerName: string
        jobSlug: string
        quantity?: number
        status: "IN_PROGRESS" | "COMPLETED"
        paidAt?: Date
      }[]
    }[]
  }

  const orderSpecs: OrderSpec[] = [
    // Đơn 1: Đám cưới đang xử lý
    {
      customer: "Nguyễn Hoàng Nam & Lê Thị Hoa",
      contactName: "Nguyễn Hoàng Nam",
      status: "WAITING_FILES",
      items: [
        {
          serviceSlug: "wedding-photo",
          name: "Chụp ảnh cưới — Lễ đình + Tiệc",
          price: 8_000_000,
          assignments: [
            { workerName: "Nguyễn Văn An",  jobSlug: "photographer", status: "COMPLETED", paidAt: new Date("2026-05-10") },
            { workerName: "Lê Hoàng Cường", jobSlug: "photographer", status: "COMPLETED", paidAt: new Date("2026-05-10") },
          ],
        },
        {
          serviceSlug: "wedding-video",
          name: "Quay phim cưới — Lễ đình + Tiệc",
          price: 12_000_000,
          assignments: [
            { workerName: "Trần Thị Bảo", jobSlug: "videographer", status: "IN_PROGRESS" },
          ],
        },
        {
          serviceSlug: "wedding-photo-edit",
          name: "Edit ảnh cưới (500 ảnh)",
          price: 3_000_000,
          assignments: [
            { workerName: "Võ Thị Ê", jobSlug: "photo-editor", status: "IN_PROGRESS" },
          ],
        },
      ],
    },
    // Đơn 2: Sự kiện công ty — hoàn thành, chưa trả lương editor
    {
      customer: "Công ty TNHH Ánh Sáng Mới",
      contactName: "Nguyễn Thị Lan",
      status: "FILES_DELIVERED",
      items: [
        {
          serviceSlug: "event-photo",
          name: "Chụp ảnh hội nghị thường niên",
          price: 5_000_000,
          assignments: [
            { workerName: "Nguyễn Văn An",  jobSlug: "photographer", status: "COMPLETED", paidAt: new Date("2026-05-05") },
          ],
        },
        {
          serviceSlug: "event-video",
          name: "Quay phim hội nghị thường niên",
          price: 6_000_000,
          assignments: [
            { workerName: "Trần Thị Bảo", jobSlug: "videographer", status: "COMPLETED", paidAt: new Date("2026-05-05") },
            { workerName: "Phạm Minh Duy", jobSlug: "video-editor", status: "COMPLETED" },
          ],
        },
      ],
    },
    // Đơn 3: Đám cưới mới nhận — đang chụp
    {
      customer: "Lê Đình Bách & Võ Thanh Mai",
      contactName: "Lê Đình Bách",
      status: "NEW",
      items: [
        {
          serviceSlug: "wedding-photo",
          name: "Chụp ảnh cưới — Gói full day",
          price: 10_000_000,
          assignments: [
            { workerName: "Lê Hoàng Cường", jobSlug: "photographer", status: "IN_PROGRESS" },
            { workerName: "Nguyễn Văn An",  jobSlug: "photographer", status: "IN_PROGRESS" },
          ],
        },
        {
          serviceSlug: "wedding-video",
          name: "Quay phim cưới — Gói full day",
          price: 15_000_000,
          assignments: [
            { workerName: "Trần Thị Bảo",  jobSlug: "videographer", status: "IN_PROGRESS" },
            { workerName: "Đinh Quốc Phong",jobSlug: "sound-engineer",status: "IN_PROGRESS" },
          ],
        },
      ],
    },
    // Đơn 4: Ảnh thương mại — hoàn thành, đã trả hết
    {
      customer: "Trần Văn Khoa",
      contactName: "Trần Văn Khoa",
      status: "COMPLETED",
      items: [
        {
          serviceSlug: "commercial-photo",
          name: "Chụp ảnh lookbook mùa hè 2026",
          price: 12_000_000,
          assignments: [
            { workerName: "Nguyễn Văn An",  jobSlug: "photographer", status: "COMPLETED", paidAt: new Date("2026-04-20") },
            { workerName: "Võ Thị Ê",       jobSlug: "photo-editor",  status: "COMPLETED", paidAt: new Date("2026-04-25") },
          ],
        },
      ],
    },
    // Đơn 5: MV / Motion — đang edit, chưa trả
    {
      customer: "Phạm Thu Hằng",
      contactName: "Phạm Thu Hằng",
      status: "WAITING_FILES",
      items: [
        {
          serviceSlug: "motion-mv",
          name: "MV ca nhạc — Phạm Thu Hằng",
          price: 20_000_000,
          assignments: [
            { workerName: "Trần Thị Bảo",  jobSlug: "videographer",   status: "COMPLETED", paidAt: new Date("2026-05-01") },
            { workerName: "Phạm Minh Duy", jobSlug: "motion-designer", status: "IN_PROGRESS" },
            { workerName: "Đinh Quốc Phong",jobSlug: "sound-engineer", status: "COMPLETED" },
          ],
        },
      ],
    },
  ]

  let orderCounter = 1000
  for (const spec of orderSpecs) {
    const orderNumber = `ORD-${String(++orderCounter)}`
    const customerId = customerMap.get(spec.customer)

    const totalAmount = spec.items.reduce((s, item) => s + item.price * (item.quantity ?? 1), 0)

    const order = await db.order.create({
      data: {
        orderNumber,
        contactName: spec.contactName,
        customerId,
        status: spec.status,
        totalAmount: new Prisma.Decimal(totalAmount),
        subtotal: new Prisma.Decimal(totalAmount),
        currency: "VND",
        createdById: admin.id,
      },
    })

    for (const itemSpec of spec.items) {
      const svcId = serviceMap.get(itemSpec.serviceSlug)!
      const qty = itemSpec.quantity ?? 1
      const orderItem = await db.orderItem.create({
        data: {
          orderId: order.id,
          serviceDefinitionId: svcId,
          name: itemSpec.name,
          price: new Prisma.Decimal(itemSpec.price),
          quantity: qty,
          totalPrice: new Prisma.Decimal(itemSpec.price * qty),
        },
      })

      for (const asgn of itemSpec.assignments) {
        const workerId = workerMap.get(asgn.workerName)!
        const jobTypeId = jobTypeMap.get(asgn.jobSlug)!

        const workerRecord = WORKERS.find((w) => w.name === asgn.workerName)!
        const rateSpec = workerRecord.rates.find((r) => r.jobSlug === asgn.jobSlug)!
        const rateAmount = new Prisma.Decimal(rateSpec.amount)
        const quantity = new Prisma.Decimal(asgn.quantity ?? 1)

        await db.orderItemWorker.create({
          data: {
            orderItemId: orderItem.id,
            workerId,
            jobTypeId,
            workerNameSnapshot: asgn.workerName,
            jobTypeNameSnapshot: JOB_TYPES.find((j) => j.slug === asgn.jobSlug)!.name,
            rateTypeSnapshot: rateSpec.rateType as "PER_JOB" | "HOURLY" | "DAILY",
            rateAmountSnapshot: rateAmount,
            quantity,
            totalCost: rateAmount.mul(quantity),
            status: asgn.status,
            paidAt: asgn.paidAt ?? null,
            startedAt: new Date("2026-05-01"),
            completedAt: asgn.status === "COMPLETED" ? (asgn.paidAt ?? new Date("2026-05-15")) : null,
            assignedById: admin.id,
          },
        })
      }
    }

    const assignmentCount = spec.items.reduce((s, i) => s + i.assignments.length, 0)
    console.log(`  ✓ ${orderNumber} — ${spec.customer} (${spec.items.length} dịch vụ, ${assignmentCount} phân công)`)
  }

  // ── Tóm tắt ───────────────────────────────────────────────────────────────
  const [wCount, oCount, aCount] = await Promise.all([
    db.worker.count(),
    db.order.count(),
    db.orderItemWorker.count(),
  ])
  console.log(`
✅ Test data đã tạo xong:
   • ${JOB_TYPES.length} job types
   • ${SERVICES.length} service definitions
   • ${wCount} workers
   • ${CUSTOMERS.length} customers
   • ${oCount} orders
   • ${aCount} assignments (phân công)
`)
}

main()
  .catch((err) => {
    console.error("❌ Thất bại:", err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

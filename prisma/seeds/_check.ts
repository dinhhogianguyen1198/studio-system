import { db } from "../client"

async function main() {
  const [users, customers, orders, workers, cats] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true }, take: 5 }),
    db.customer.findMany({ select: { id: true, name: true }, take: 5 }),
    db.order.findMany({ select: { id: true, orderNumber: true, status: true }, take: 5 }),
    db.worker.findMany({ select: { id: true, name: true, isActive: true }, take: 5 }),
    db.expenseCategory.findMany({ select: { id: true, name: true }, take: 10 }),
  ])
  console.log("USERS:" + JSON.stringify(users))
  console.log("CUSTOMERS:" + JSON.stringify(customers))
  console.log("ORDERS:" + JSON.stringify(orders))
  console.log("WORKERS:" + JSON.stringify(workers))
  console.log("CATS:" + JSON.stringify(cats))
}

main().catch(console.error).finally(() => db.$disconnect())

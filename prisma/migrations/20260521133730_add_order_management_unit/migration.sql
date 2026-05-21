-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "orderManagementUnitId" TEXT;

-- CreateTable
CREATE TABLE "order_management_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_management_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_management_units_name_key" ON "order_management_units"("name");

-- CreateIndex
CREATE INDEX "order_management_units_isActive_idx" ON "order_management_units"("isActive");

-- CreateIndex
CREATE INDEX "order_management_units_sortOrder_idx" ON "order_management_units"("sortOrder");

-- CreateIndex
CREATE INDEX "customers_createdById_idx" ON "customers"("createdById");

-- CreateIndex
CREATE INDEX "leads_priority_idx" ON "leads"("priority");

-- CreateIndex
CREATE INDEX "leads_createdById_idx" ON "leads"("createdById");

-- CreateIndex
CREATE INDEX "leads_closedAt_idx" ON "leads"("closedAt");

-- CreateIndex
CREATE INDEX "orders_orderManagementUnitId_idx" ON "orders"("orderManagementUnitId");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_orderManagementUnitId_fkey" FOREIGN KEY ("orderManagementUnitId") REFERENCES "order_management_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_management_units" ADD CONSTRAINT "order_management_units_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

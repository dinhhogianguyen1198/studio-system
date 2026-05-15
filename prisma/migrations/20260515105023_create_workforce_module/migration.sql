-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('PER_JOB', 'HOURLY', 'DAILY');

-- CreateEnum
CREATE TYPE "WorkerAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_job_types" (
    "workerId" TEXT NOT NULL,
    "jobTypeId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_job_types_pkey" PRIMARY KEY ("workerId","jobTypeId")
);

-- CreateTable
CREATE TABLE "worker_rates" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "jobTypeId" TEXT NOT NULL,
    "serviceDefinitionId" TEXT,
    "rateType" "RateType" NOT NULL DEFAULT 'PER_JOB',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_workers" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "jobTypeId" TEXT NOT NULL,
    "workerNameSnapshot" TEXT NOT NULL,
    "jobTypeNameSnapshot" TEXT NOT NULL,
    "rateTypeSnapshot" "RateType" NOT NULL,
    "rateAmountSnapshot" DECIMAL(15,2) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "totalCost" DECIMAL(15,2) NOT NULL,
    "status" "WorkerAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_workers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workers_isActive_idx" ON "workers"("isActive");

-- CreateIndex
CREATE INDEX "workers_name_idx" ON "workers"("name");

-- CreateIndex
CREATE INDEX "workers_email_idx" ON "workers"("email");

-- CreateIndex
CREATE INDEX "workers_createdAt_idx" ON "workers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_types_name_key" ON "job_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "job_types_slug_key" ON "job_types"("slug");

-- CreateIndex
CREATE INDEX "job_types_isActive_idx" ON "job_types"("isActive");

-- CreateIndex
CREATE INDEX "job_types_slug_idx" ON "job_types"("slug");

-- CreateIndex
CREATE INDEX "job_types_sortOrder_idx" ON "job_types"("sortOrder");

-- CreateIndex
CREATE INDEX "worker_job_types_workerId_idx" ON "worker_job_types"("workerId");

-- CreateIndex
CREATE INDEX "worker_job_types_jobTypeId_idx" ON "worker_job_types"("jobTypeId");

-- CreateIndex
CREATE INDEX "worker_rates_workerId_idx" ON "worker_rates"("workerId");

-- CreateIndex
CREATE INDEX "worker_rates_jobTypeId_idx" ON "worker_rates"("jobTypeId");

-- CreateIndex
CREATE INDEX "worker_rates_serviceDefinitionId_idx" ON "worker_rates"("serviceDefinitionId");

-- CreateIndex
CREATE INDEX "worker_rates_isActive_idx" ON "worker_rates"("isActive");

-- CreateIndex
CREATE INDEX "order_item_workers_orderItemId_idx" ON "order_item_workers"("orderItemId");

-- CreateIndex
CREATE INDEX "order_item_workers_workerId_idx" ON "order_item_workers"("workerId");

-- CreateIndex
CREATE INDEX "order_item_workers_jobTypeId_idx" ON "order_item_workers"("jobTypeId");

-- CreateIndex
CREATE INDEX "order_item_workers_status_idx" ON "order_item_workers"("status");

-- CreateIndex
CREATE INDEX "order_item_workers_createdAt_idx" ON "order_item_workers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_workers_orderItemId_workerId_jobTypeId_key" ON "order_item_workers"("orderItemId", "workerId", "jobTypeId");

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_types" ADD CONSTRAINT "job_types_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_job_types" ADD CONSTRAINT "worker_job_types_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_job_types" ADD CONSTRAINT "worker_job_types_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "job_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_rates" ADD CONSTRAINT "worker_rates_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_rates" ADD CONSTRAINT "worker_rates_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "job_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_rates" ADD CONSTRAINT "worker_rates_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "service_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_workers" ADD CONSTRAINT "order_item_workers_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_workers" ADD CONSTRAINT "order_item_workers_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_workers" ADD CONSTRAINT "order_item_workers_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "job_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_workers" ADD CONSTRAINT "order_item_workers_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

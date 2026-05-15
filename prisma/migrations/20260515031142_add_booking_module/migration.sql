-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('LEAD', 'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'EDITING', 'REVIEW', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "BookingStaffRole" AS ENUM ('PHOTOGRAPHER', 'VIDEOGRAPHER', 'EDITOR', 'ASSISTANT', 'DIRECTOR');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "shootDate" TIMESTAMP(3) NOT NULL,
    "shootEndDate" TIMESTAMP(3),
    "location" TEXT,
    "packageName" TEXT,
    "totalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "depositAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "depositPaidAt" TIMESTAMP(3),
    "depositStatus" "DepositStatus" NOT NULL DEFAULT 'UNPAID',
    "status" "BookingStatus" NOT NULL DEFAULT 'LEAD',
    "notes" TEXT,
    "internalNotes" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_staff" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BookingStaffRole" NOT NULL DEFAULT 'PHOTOGRAPHER',
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_shootDate_idx" ON "bookings"("shootDate");

-- CreateIndex
CREATE INDEX "bookings_customerId_idx" ON "bookings"("customerId");

-- CreateIndex
CREATE INDEX "bookings_assignedToId_idx" ON "bookings"("assignedToId");

-- CreateIndex
CREATE INDEX "bookings_createdById_idx" ON "bookings"("createdById");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "booking_status_history_bookingId_idx" ON "booking_status_history"("bookingId");

-- CreateIndex
CREATE INDEX "booking_staff_bookingId_idx" ON "booking_staff"("bookingId");

-- CreateIndex
CREATE INDEX "booking_staff_userId_idx" ON "booking_staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_staff_bookingId_userId_key" ON "booking_staff"("bookingId", "userId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_staff" ADD CONSTRAINT "booking_staff_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_staff" ADD CONSTRAINT "booking_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_staff" ADD CONSTRAINT "booking_staff_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

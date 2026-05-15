/*
  Warnings:

  - You are about to drop the `booking_staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `booking_status_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bookings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "booking_staff" DROP CONSTRAINT "booking_staff_assignedById_fkey";

-- DropForeignKey
ALTER TABLE "booking_staff" DROP CONSTRAINT "booking_staff_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "booking_staff" DROP CONSTRAINT "booking_staff_userId_fkey";

-- DropForeignKey
ALTER TABLE "booking_status_history" DROP CONSTRAINT "booking_status_history_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "booking_status_history" DROP CONSTRAINT "booking_status_history_changedById_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_createdById_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_customerId_fkey";

-- DropTable
DROP TABLE "booking_staff";

-- DropTable
DROP TABLE "booking_status_history";

-- DropTable
DROP TABLE "bookings";

-- DropEnum
DROP TYPE "BookingStaffRole";

-- DropEnum
DROP TYPE "BookingStatus";

-- DropEnum
DROP TYPE "DepositStatus";

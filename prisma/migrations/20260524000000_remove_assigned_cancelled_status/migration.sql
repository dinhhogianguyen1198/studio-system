-- Migration: remove ASSIGNED and CANCELLED from WorkerAssignmentStatus enum
-- Convert any existing ASSIGNED records to IN_PROGRESS before altering the enum

UPDATE "order_item_workers" SET "status" = 'IN_PROGRESS' WHERE "status" = 'ASSIGNED';
DELETE FROM "order_item_workers" WHERE "status" = 'CANCELLED';

-- AlterEnum: recreate without ASSIGNED and CANCELLED
BEGIN;
CREATE TYPE "WorkerAssignmentStatus_new" AS ENUM ('IN_PROGRESS', 'COMPLETED');
ALTER TABLE "order_item_workers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "order_item_workers" ALTER COLUMN "status" TYPE "WorkerAssignmentStatus_new" USING ("status"::text::"WorkerAssignmentStatus_new");
ALTER TYPE "WorkerAssignmentStatus" RENAME TO "WorkerAssignmentStatus_old";
ALTER TYPE "WorkerAssignmentStatus_new" RENAME TO "WorkerAssignmentStatus";
DROP TYPE "WorkerAssignmentStatus_old";
ALTER TABLE "order_item_workers" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';
COMMIT;

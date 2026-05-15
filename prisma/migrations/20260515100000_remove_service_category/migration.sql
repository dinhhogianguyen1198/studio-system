-- Remove service categories: drop categoryId from service_definitions, drop service_categories table

-- Step 1: Drop foreign key constraint and column from service_definitions
ALTER TABLE "service_definitions" DROP COLUMN "categoryId";

-- Step 2: Drop index that referenced categoryId
DROP INDEX IF EXISTS "service_definitions_categoryId_idx";

-- Step 3: Drop the service_categories table
DROP TABLE IF EXISTS "service_categories";

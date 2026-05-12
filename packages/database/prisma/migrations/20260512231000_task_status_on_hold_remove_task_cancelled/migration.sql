-- Task workflow: DEFERRED → ON_HOLD; remove CANCELLED (historical rows → COMPLETED).
ALTER TYPE "TaskStatusEnum" ADD VALUE IF NOT EXISTS 'ON_HOLD';

UPDATE "tasks" SET "status" = 'COMPLETED' WHERE "status" = 'CANCELLED';
UPDATE "tasks" SET "status" = 'ON_HOLD' WHERE "status" = 'DEFERRED';

CREATE TYPE "TaskStatusEnum_new" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'REVIEW',
  'COMPLETED',
  'ON_HOLD',
  'NEW',
  'DONE'
);

ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "tasks"
  ALTER COLUMN "status" TYPE "TaskStatusEnum_new"
  USING ("status"::text::"TaskStatusEnum_new");

DROP TYPE "TaskStatusEnum";
ALTER TYPE "TaskStatusEnum_new" RENAME TO "TaskStatusEnum";

ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"TaskStatusEnum";

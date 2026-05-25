-- Task review workflow fields + remove legacy TaskStatusEnum values (NEW, DONE).

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "reviewer_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "review_requested_at" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "review_approved_at" TIMESTAMP(3);

ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_reviewer_id_fkey"
  FOREIGN KEY ("reviewer_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "tasks_reviewer_id_idx" ON "tasks"("reviewer_id");

UPDATE "tasks" SET "status" = 'OPEN' WHERE "status" = 'NEW';
UPDATE "tasks" SET "status" = 'COMPLETED' WHERE "status" = 'DONE';

CREATE TYPE "TaskStatusEnum_new" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'REVIEW',
  'ON_HOLD',
  'COMPLETED'
);

ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "tasks"
  ALTER COLUMN "status" TYPE "TaskStatusEnum_new"
  USING ("status"::text::"TaskStatusEnum_new");

DROP TYPE "TaskStatusEnum";
ALTER TYPE "TaskStatusEnum_new" RENAME TO "TaskStatusEnum";

ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"TaskStatusEnum";

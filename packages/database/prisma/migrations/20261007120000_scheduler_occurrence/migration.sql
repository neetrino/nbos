-- Durable scheduler firing. Additive: old processes ignore this table.
-- Deploy the migration before the scheduler process that enqueues occurrences.

CREATE TABLE IF NOT EXISTS "scheduler_occurrences" (
  "id" TEXT NOT NULL,
  "job_name" TEXT NOT NULL,
  "scheduled_for" TIMESTAMP(3) NOT NULL,
  "trigger" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "queue_job_id" TEXT,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "queued_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  CONSTRAINT "scheduler_occurrences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "scheduler_occurrences_job_name_scheduled_for_key"
  ON "scheduler_occurrences"("job_name", "scheduled_for");

CREATE INDEX IF NOT EXISTS "scheduler_occurrences_status_created_at_idx"
  ON "scheduler_occurrences"("status", "created_at");

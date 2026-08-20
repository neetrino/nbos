-- SchedulerJobPolicy: admin enable/disable for platform cron jobs.

CREATE TABLE IF NOT EXISTS "scheduler_job_policies" (
  "job_name" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduler_job_policies_pkey" PRIMARY KEY ("job_name")
);

CREATE INDEX IF NOT EXISTS "scheduler_job_policies_enabled_idx"
  ON "scheduler_job_policies"("enabled");

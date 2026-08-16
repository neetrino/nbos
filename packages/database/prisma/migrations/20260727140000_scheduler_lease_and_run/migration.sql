-- SchedulerLease + SchedulerRun for distributed cron ownership (Phase 4).

CREATE TABLE IF NOT EXISTS "scheduler_leases" (
  "job_name" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "lease_until" TIMESTAMP(3) NOT NULL,
  "heartbeat_at" TIMESTAMP(3) NOT NULL,
  "fencing_token" BIGINT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduler_leases_pkey" PRIMARY KEY ("job_name")
);

CREATE INDEX IF NOT EXISTS "scheduler_leases_lease_until_idx"
  ON "scheduler_leases"("lease_until");

CREATE TABLE IF NOT EXISTS "scheduler_runs" (
  "id" TEXT NOT NULL,
  "job_name" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "fencing_token" BIGINT NOT NULL,
  "trigger" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL,
  "heartbeat_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "duration_ms" INTEGER,
  "processed_count" INTEGER,
  "error_code" TEXT,
  "error_message" TEXT,
  "metadata" JSONB,
  CONSTRAINT "scheduler_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "scheduler_runs_job_name_started_at_idx"
  ON "scheduler_runs"("job_name", "started_at");

CREATE INDEX IF NOT EXISTS "scheduler_runs_status_started_at_idx"
  ON "scheduler_runs"("status", "started_at");

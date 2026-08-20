-- SchedulerJobRuntime: nbos-scheduler writes status snapshots for Settings catalog.

CREATE TABLE IF NOT EXISTS "scheduler_job_runtimes" (
  "job_name" TEXT NOT NULL,
  "master_enabled" BOOLEAN NOT NULL,
  "registered" BOOLEAN NOT NULL,
  "enabled_by_env" BOOLEAN NOT NULL,
  "expression" TEXT,
  "timezone" TEXT NOT NULL,
  "heartbeat_at" TIMESTAMP(3) NOT NULL,
  "scheduler_owner_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduler_job_runtimes_pkey" PRIMARY KEY ("job_name")
);

CREATE INDEX IF NOT EXISTS "scheduler_job_runtimes_heartbeat_at_idx"
  ON "scheduler_job_runtimes"("heartbeat_at");

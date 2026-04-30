CREATE TYPE "ReportScheduleStatusEnum" AS ENUM (
  'ACTIVE',
  'PAUSED',
  'FAILED',
  'ARCHIVED'
);

CREATE TABLE "report_schedules" (
  "id" TEXT NOT NULL,
  "report_key" TEXT NOT NULL,
  "report_title" TEXT NOT NULL,
  "owner_module" TEXT NOT NULL,
  "format" "ReportExportFormatEnum" NOT NULL,
  "status" "ReportScheduleStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  "owner_id" TEXT NOT NULL,
  "recipient_emails" TEXT[] NOT NULL,
  "schedule_label" TEXT NOT NULL,
  "filters" JSONB,
  "next_run_at" TIMESTAMP(3) NOT NULL,
  "last_run_at" TIMESTAMP(3),
  "last_export_job_id" TEXT,
  "last_failure_at" TIMESTAMP(3),
  "failure_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_schedules_report_key_idx" ON "report_schedules"("report_key");
CREATE INDEX "report_schedules_owner_module_idx" ON "report_schedules"("owner_module");
CREATE INDEX "report_schedules_status_next_run_at_idx" ON "report_schedules"("status", "next_run_at");
CREATE INDEX "report_schedules_owner_id_idx" ON "report_schedules"("owner_id");

ALTER TABLE "report_schedules"
  ADD CONSTRAINT "report_schedules_owner_id_fkey"
  FOREIGN KEY ("owner_id")
  REFERENCES "employees"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

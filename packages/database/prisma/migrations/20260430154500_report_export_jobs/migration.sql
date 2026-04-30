CREATE TYPE "ReportExportJobStatusEnum" AS ENUM (
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "ReportExportFormatEnum" AS ENUM (
  'CSV',
  'XLSX',
  'PDF'
);

CREATE TABLE "report_export_jobs" (
  "id" TEXT NOT NULL,
  "report_key" TEXT NOT NULL,
  "report_title" TEXT NOT NULL,
  "owner_module" TEXT NOT NULL,
  "format" "ReportExportFormatEnum" NOT NULL,
  "status" "ReportExportJobStatusEnum" NOT NULL DEFAULT 'QUEUED',
  "requested_by_id" TEXT NOT NULL,
  "filters" JSONB,
  "file_asset_id" TEXT,
  "error_message" TEXT,
  "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "report_export_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_export_jobs_report_key_idx" ON "report_export_jobs"("report_key");
CREATE INDEX "report_export_jobs_owner_module_idx" ON "report_export_jobs"("owner_module");
CREATE INDEX "report_export_jobs_status_queued_at_idx" ON "report_export_jobs"("status", "queued_at");
CREATE INDEX "report_export_jobs_requested_by_id_idx" ON "report_export_jobs"("requested_by_id");
CREATE INDEX "report_export_jobs_file_asset_id_idx" ON "report_export_jobs"("file_asset_id");

ALTER TABLE "report_export_jobs"
  ADD CONSTRAINT "report_export_jobs_requested_by_id_fkey"
  FOREIGN KEY ("requested_by_id")
  REFERENCES "employees"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "report_export_jobs"
  ADD CONSTRAINT "report_export_jobs_file_asset_id_fkey"
  FOREIGN KEY ("file_asset_id")
  REFERENCES "file_assets"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

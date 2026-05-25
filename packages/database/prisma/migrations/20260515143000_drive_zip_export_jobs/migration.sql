-- Drive: async ZIP export jobs (selection → R2 ZIP + manifest inside archive)

CREATE TYPE "DriveZipExportJobStatusEnum" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "drive_zip_export_jobs" (
    "id" TEXT NOT NULL,
    "status" "DriveZipExportJobStatusEnum" NOT NULL DEFAULT 'QUEUED',
    "requested_by_id" TEXT NOT NULL,
    "file_ids" JSONB NOT NULL,
    "access_snapshot" JSONB NOT NULL,
    "file_asset_id" TEXT,
    "error_message" TEXT,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_zip_export_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "drive_zip_export_jobs_requested_by_id_queued_at_idx" ON "drive_zip_export_jobs"("requested_by_id", "queued_at");

CREATE INDEX "drive_zip_export_jobs_status_queued_at_idx" ON "drive_zip_export_jobs"("status", "queued_at");

CREATE INDEX "drive_zip_export_jobs_file_asset_id_idx" ON "drive_zip_export_jobs"("file_asset_id");

ALTER TABLE "drive_zip_export_jobs" ADD CONSTRAINT "drive_zip_export_jobs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "drive_zip_export_jobs" ADD CONSTRAINT "drive_zip_export_jobs_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

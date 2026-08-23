-- ATS Phase 4: Call recording FileAsset + lifecycle status on AtsCallEvent.
-- Additive nullable columns + FK. Existing calls stay valid without a recording.

CREATE TYPE "AtsCallRecordingStatusEnum" AS ENUM ('PENDING', 'DOWNLOADING', 'READY', 'FAILED');

ALTER TABLE "ats_call_events" ADD COLUMN "recording_status" "AtsCallRecordingStatusEnum";
ALTER TABLE "ats_call_events" ADD COLUMN "recording_file_asset_id" TEXT;

CREATE INDEX "ats_call_events_recording_file_asset_id_idx" ON "ats_call_events"("recording_file_asset_id");
CREATE INDEX "ats_call_events_recording_status_idx" ON "ats_call_events"("recording_status");

ALTER TABLE "ats_call_events"
  ADD CONSTRAINT "ats_call_events_recording_file_asset_id_fkey"
  FOREIGN KEY ("recording_file_asset_id") REFERENCES "file_assets"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

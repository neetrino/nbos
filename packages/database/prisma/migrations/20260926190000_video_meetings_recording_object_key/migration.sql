-- Video Meetings S05 — store intended egress object keys before Drive finalize (S06).
-- Risk: LOW (nullable column + index only). No DROP. file_asset_id remains null until S06.

-- AlterTable
ALTER TABLE "video_meeting_recording_assets"
  ADD COLUMN "object_key" TEXT;

-- CreateIndex
CREATE INDEX "video_meeting_recording_assets_object_key_idx"
  ON "video_meeting_recording_assets"("object_key");

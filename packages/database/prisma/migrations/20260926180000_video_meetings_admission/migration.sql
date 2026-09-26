-- Video Meetings S03 — additive admission status + invite↔participant link.
-- Risk: LOW (new enum + nullable columns + indexes on new table only). No DROP.
-- Existing participant rows (if any on disposable/dev) default to WAITING.

-- CreateEnum
CREATE TYPE "VideoMeetingAdmissionStatus" AS ENUM ('WAITING', 'ADMITTED', 'REJECTED');

-- AlterTable
ALTER TABLE "video_meeting_participants"
  ADD COLUMN "invite_id" TEXT,
  ADD COLUMN "admission_status" "VideoMeetingAdmissionStatus" NOT NULL DEFAULT 'WAITING';

-- CreateIndex
CREATE UNIQUE INDEX "video_meeting_participants_invite_id_key" ON "video_meeting_participants"("invite_id");

-- CreateIndex
CREATE INDEX "video_meeting_participants_meeting_id_admission_status_idx" ON "video_meeting_participants"("meeting_id", "admission_status");

-- AddForeignKey
ALTER TABLE "video_meeting_participants"
  ADD CONSTRAINT "video_meeting_participants_invite_id_fkey"
  FOREIGN KEY ("invite_id") REFERENCES "video_meeting_invites"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

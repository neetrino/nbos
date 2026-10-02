-- Video Meetings durable room — step 2 of 2: backfill ENDED → IDLE and persist room chat.
-- Risk: MEDIUM (data backfill on video_meetings only + new table). No DROP.
-- Backfill is idempotent; application code stops writing ENDED and reads legacy ENDED as IDLE.

-- Backfill
UPDATE "video_meetings" SET "status" = 'IDLE' WHERE "status" = 'ENDED';

-- CreateTable
CREATE TABLE "video_meeting_messages" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "session_id" TEXT,
    "author_participant_id" TEXT,
    "employee_id" TEXT,
    "author_display_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_meeting_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_meeting_messages_meeting_id_created_at_idx" ON "video_meeting_messages"("meeting_id", "created_at");

-- CreateIndex
CREATE INDEX "video_meeting_messages_session_id_idx" ON "video_meeting_messages"("session_id");

-- AddForeignKey
ALTER TABLE "video_meeting_messages" ADD CONSTRAINT "video_meeting_messages_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "video_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_messages" ADD CONSTRAINT "video_meeting_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "video_meeting_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_messages" ADD CONSTRAINT "video_meeting_messages_author_participant_id_fkey" FOREIGN KEY ("author_participant_id") REFERENCES "video_meeting_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

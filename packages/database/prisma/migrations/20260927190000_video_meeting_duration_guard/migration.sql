-- Video meeting duration guard. Additive nullable columns on the live session.
-- Risk: LOW. ADD COLUMN, then one UPDATE of open sessions already past the first hour.
-- Those sessions would otherwise be due on the first sweep and end with no warning.
-- The last full hour is marked as already continued, so the next warning opens first.

ALTER TABLE "video_meeting_sessions"
  ADD COLUMN "duration_continued_through" TIMESTAMP(3),
  ADD COLUMN "duration_continued_at" TIMESTAMP(3),
  ADD COLUMN "duration_continued_by_employee_id" TEXT;

UPDATE "video_meeting_sessions"
SET "duration_continued_through" =
  "started_at" + (
    FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "started_at")) / 3600)
    * INTERVAL '1 hour'
  )
WHERE "ended_at" IS NULL
  AND "started_at" IS NOT NULL
  AND "started_at" <= CURRENT_TIMESTAMP - INTERVAL '1 hour'
  AND "duration_continued_through" IS NULL;

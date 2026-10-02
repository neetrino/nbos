-- Video Meetings durable room — expand step 1 of 2: add the IDLE room status.
-- Risk: LOW (additive enum value). No DROP; ENDED stays in the type (Postgres cannot drop enum values).
-- Kept in its own migration: a new enum value cannot be used in the same transaction that adds it.

-- AlterEnum
ALTER TYPE "VideoMeetingStatus" ADD VALUE IF NOT EXISTS 'IDLE';

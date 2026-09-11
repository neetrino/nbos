-- Slice 5: additive Task Discussion mapping kinds + optional Core message metadata.
-- Does not DROP the legacy discussion table, Channel/DM, Unified, or Meta.
-- Does not reuse the leftover Task chat column. Does not convert Activity into human messages.

ALTER TYPE "MessengerLegacyIdentityKind" ADD VALUE IF NOT EXISTS 'TASK';
ALTER TYPE "MessengerLegacyIdentityKind" ADD VALUE IF NOT EXISTS 'TASK_DISCUSSION_ENTRY';

ALTER TABLE "messenger_messages" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

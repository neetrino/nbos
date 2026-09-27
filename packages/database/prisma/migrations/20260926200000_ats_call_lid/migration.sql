-- Persist ATS conversation id. Nullable: existing rows stay valid and are not grouped.
-- UID remains the unique connection key. No backfill and no data rewrite.

ALTER TABLE "ats_call_events" ADD COLUMN "lid" TEXT;

CREATE INDEX "ats_call_events_lid_created_at_idx" ON "ats_call_events"("lid", "created_at");

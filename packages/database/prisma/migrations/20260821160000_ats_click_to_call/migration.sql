-- ATS Phase 5: click-to-call provenance on AtsCallEvent.
-- Additive nullable columns + FK. Existing webhook rows stay valid.

ALTER TABLE "ats_call_events" ADD COLUMN "source" TEXT;
ALTER TABLE "ats_call_events" ADD COLUMN "initiated_by_employee_id" TEXT;

CREATE INDEX "ats_call_events_initiated_by_employee_id_idx"
  ON "ats_call_events"("initiated_by_employee_id");

CREATE INDEX "ats_call_events_source_phone_created_at_idx"
  ON "ats_call_events"("source", "phone", "created_at");

ALTER TABLE "ats_call_events"
  ADD CONSTRAINT "ats_call_events_initiated_by_employee_id_fkey"
  FOREIGN KEY ("initiated_by_employee_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

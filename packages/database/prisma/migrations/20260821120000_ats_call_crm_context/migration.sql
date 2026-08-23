-- ATS Call Core Phase 1: grow AtsCallEvent into the CRM Call record.
-- Additive nullable columns + FKs. Existing rows stay valid (lead_id only).

ALTER TABLE "ats_call_events" ADD COLUMN "phone" TEXT;
ALTER TABLE "ats_call_events" ADD COLUMN "contact_id" TEXT;
ALTER TABLE "ats_call_events" ADD COLUMN "deal_id" TEXT;
ALTER TABLE "ats_call_events" ADD COLUMN "responsible_employee_id" TEXT;
ALTER TABLE "ats_call_events" ADD COLUMN "answered_employee_id" TEXT;

CREATE INDEX "ats_call_events_contact_id_idx" ON "ats_call_events"("contact_id");
CREATE INDEX "ats_call_events_deal_id_idx" ON "ats_call_events"("deal_id");
CREATE INDEX "ats_call_events_phone_idx" ON "ats_call_events"("phone");
CREATE INDEX "ats_call_events_created_at_idx" ON "ats_call_events"("created_at");

ALTER TABLE "ats_call_events"
  ADD CONSTRAINT "ats_call_events_contact_id_fkey"
  FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ats_call_events"
  ADD CONSTRAINT "ats_call_events_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ats_call_events"
  ADD CONSTRAINT "ats_call_events_responsible_employee_id_fkey"
  FOREIGN KEY ("responsible_employee_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ats_call_events"
  ADD CONSTRAINT "ats_call_events_answered_employee_id_fkey"
  FOREIGN KEY ("answered_employee_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

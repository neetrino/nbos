-- ATS.am Active Call webhook: idempotent call events linked to CRM Leads.

CREATE TABLE "ats_call_events" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "state" TEXT,
    "disposition" TEXT,
    "billsec" TEXT,
    "record_link" TEXT,
    "clid" TEXT,
    "input" TEXT,
    "calldirect" TEXT,
    "op" TEXT,
    "channel" TEXT,
    "rate" TEXT,
    "lead_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ats_call_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ats_call_events_uid_key" ON "ats_call_events"("uid");

CREATE INDEX "ats_call_events_lead_id_idx" ON "ats_call_events"("lead_id");

CREATE INDEX "ats_call_events_clid_idx" ON "ats_call_events"("clid");

CREATE INDEX "leads_phone_idx" ON "leads"("phone");

ALTER TABLE "ats_call_events"
    ADD CONSTRAINT "ats_call_events_lead_id_fkey"
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Durable click-to-call intent scoped by actor + Idempotency-Key.
-- Additive independent table: existing Call/webhook rows unchanged.
-- Rolling deploy: migrate first, then API that writes intents. Old pods ignore the table.
-- Rollback: revert API first; leftover rows are inert. Forward-fix: DROP TABLE only if unused.

CREATE TYPE "AtsCallIntentStatusEnum" AS ENUM ('PENDING', 'PROCESSING', 'ACCEPTED', 'FAILED');

CREATE TABLE "ats_call_intents" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "status" "AtsCallIntentStatusEnum" NOT NULL,
    "call_id" TEXT,
    "ats_uid" TEXT,
    "error_code" TEXT,
    "claimed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ats_call_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ats_call_intents_employee_id_idempotency_key_key"
  ON "ats_call_intents"("employee_id", "idempotency_key");

CREATE INDEX "ats_call_intents_call_id_idx" ON "ats_call_intents"("call_id");

CREATE INDEX "ats_call_intents_status_updated_at_idx"
  ON "ats_call_intents"("status", "updated_at");

ALTER TABLE "ats_call_intents"
  ADD CONSTRAINT "ats_call_intents_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ats_call_intents"
  ADD CONSTRAINT "ats_call_intents_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "ats_call_events"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

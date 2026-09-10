-- Phase 4 additive coalesced revision tables (LOW risk).
-- No historical conversation backfill. Two counter seed rows only.
-- Two-stage activation: deploy instrumented writers first (tables unused by old
-- code). Do not set MESSENGER_DELTA_RECOVERY_ENABLED until every API/worker
-- instance writes revision rows. Then enable the flag, roll all instances, and
-- let clients take a fresh bootstrap before trusting checkpoints.
-- Application rollback may leave inert additive rows (forward-fix; do not DROP here).

DO $$ BEGIN
  CREATE TYPE "MessengerRevisionChangeKind" AS ENUM (
    'CONVERSATION',
    'READ',
    'FAVORITE',
    'ACCESS_REMOVED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "messenger_zone_revision_counters" (
  "zone" "MessengerConversationZone" NOT NULL,
  "revision" BIGINT NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messenger_zone_revision_counters_pkey" PRIMARY KEY ("zone")
);

INSERT INTO "messenger_zone_revision_counters" ("zone", "revision", "updated_at")
VALUES
  ('INTERNAL', 0, CURRENT_TIMESTAMP),
  ('CLIENT', 0, CURRENT_TIMESTAMP)
ON CONFLICT ("zone") DO NOTHING;

CREATE TABLE IF NOT EXISTS "messenger_conversation_revisions" (
  "id" TEXT NOT NULL,
  "zone" "MessengerConversationZone" NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "change_kind" "MessengerRevisionChangeKind" NOT NULL,
  "revision" BIGINT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messenger_conversation_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "messenger_conversation_revisions_zone_conversation_key"
  ON "messenger_conversation_revisions" ("zone", "conversation_id");

CREATE INDEX IF NOT EXISTS "messenger_conversation_revisions_zone_revision_idx"
  ON "messenger_conversation_revisions" ("zone", "revision", "conversation_id");

CREATE TABLE IF NOT EXISTS "messenger_employee_conversation_revisions" (
  "id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "zone" "MessengerConversationZone" NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "change_kind" "MessengerRevisionChangeKind" NOT NULL,
  "revision" BIGINT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messenger_employee_conversation_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "messenger_employee_revisions_employee_zone_conversation_key"
  ON "messenger_employee_conversation_revisions" ("employee_id", "zone", "conversation_id");

CREATE INDEX IF NOT EXISTS "messenger_employee_revisions_employee_zone_revision_idx"
  ON "messenger_employee_conversation_revisions" ("employee_id", "zone", "revision", "conversation_id");

DO $$ BEGIN
  ALTER TABLE "messenger_conversation_revisions"
    ADD CONSTRAINT "messenger_conversation_revisions_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messenger_employee_conversation_revisions"
    ADD CONSTRAINT "messenger_employee_conversation_revisions_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messenger_employee_conversation_revisions"
    ADD CONSTRAINT "messenger_employee_conversation_revisions_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

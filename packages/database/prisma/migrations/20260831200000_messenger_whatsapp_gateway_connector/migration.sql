-- Slice 8: WhatsApp Gateway connector — provider events, external message refs,
-- webhook signing secret. Additive only.
-- Does not DROP ProductWhatsAppGroupBinding / Meta / Channel / DM / TaskDiscussionEntry.
-- Does not create ProductCommunicationBinding (Slice 9).

ALTER TYPE "MessengerCommandStatus" ADD VALUE IF NOT EXISTS 'OUTCOME_UNKNOWN';

DO $$ BEGIN
  CREATE TYPE "MessengerProviderEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "whatsapp_gateway_connections"
  ADD COLUMN IF NOT EXISTS "encrypted_webhook_secret" TEXT,
  ADD COLUMN IF NOT EXISTS "gateway_account_id" TEXT;

CREATE TABLE IF NOT EXISTS "messenger_provider_events" (
  "id" TEXT NOT NULL,
  "provider" "MessengerExternalProvider" NOT NULL,
  "event_id" TEXT NOT NULL,
  "external_account_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "status" "MessengerProviderEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "skip_reason" TEXT,
  "conversation_id" TEXT,
  "message_id" TEXT,
  "payload" JSONB,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messenger_provider_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "messenger_provider_events_provider_event_id_key"
  ON "messenger_provider_events" ("provider", "event_id");

CREATE INDEX IF NOT EXISTS "messenger_provider_events_external_account_id_event_type_idx"
  ON "messenger_provider_events" ("external_account_id", "event_type");

CREATE INDEX IF NOT EXISTS "messenger_provider_events_conversation_id_idx"
  ON "messenger_provider_events" ("conversation_id");

CREATE INDEX IF NOT EXISTS "messenger_provider_events_message_id_idx"
  ON "messenger_provider_events" ("message_id");

DO $$ BEGIN
  ALTER TABLE "messenger_provider_events"
    ADD CONSTRAINT "messenger_provider_events_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messenger_provider_events"
    ADD CONSTRAINT "messenger_provider_events_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "messenger_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "messenger_message_external_refs" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "provider" "MessengerExternalProvider" NOT NULL,
  "external_account_id" TEXT NOT NULL,
  "external_message_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messenger_message_external_refs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "messenger_message_external_refs_provider_account_message_key"
  ON "messenger_message_external_refs" ("provider", "external_account_id", "external_message_id");

CREATE INDEX IF NOT EXISTS "messenger_message_external_refs_message_id_idx"
  ON "messenger_message_external_refs" ("message_id");

DO $$ BEGIN
  ALTER TABLE "messenger_message_external_refs"
    ADD CONSTRAINT "messenger_message_external_refs_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "messenger_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

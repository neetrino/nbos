-- Meta messaging identity, conversation, and message persistence for Lead deduplication.

CREATE TYPE "MetaMessageDirectionEnum" AS ENUM ('INBOUND', 'OUTBOUND');

CREATE TYPE "MetaMessageTypeEnum" AS ENUM ('TEXT', 'EMPTY', 'UNSUPPORTED');

CREATE TABLE "meta_sender_identities" (
    "id" TEXT NOT NULL,
    "platform" "MetaPlatformEnum" NOT NULL,
    "meta_connected_account_id" TEXT NOT NULL,
    "sender_scoped_id" TEXT NOT NULL,
    "display_name" TEXT,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "profile_picture_url" TEXT,
    "profile_fetched_at" TIMESTAMP(3),
    "profile_fetch_status" TEXT,
    "last_profile_fetch_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_sender_identities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_conversations" (
    "id" TEXT NOT NULL,
    "meta_connected_account_id" TEXT NOT NULL,
    "sender_identity_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "last_message_at" TIMESTAMP(3),
    "latest_message_preview" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "meta_connected_account_id" TEXT NOT NULL,
    "provider_message_id" TEXT NOT NULL,
    "platform" "MetaPlatformEnum" NOT NULL,
    "direction" "MetaMessageDirectionEnum" NOT NULL,
    "message_type" "MetaMessageTypeEnum" NOT NULL,
    "text" TEXT,
    "sent_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meta_sender_identities_platform_meta_connected_account_id_s_key"
    ON "meta_sender_identities"("platform", "meta_connected_account_id", "sender_scoped_id");

CREATE INDEX "meta_sender_identities_meta_connected_account_id_idx"
    ON "meta_sender_identities"("meta_connected_account_id");

CREATE UNIQUE INDEX "meta_conversations_meta_connected_account_id_sender_identit_key"
    ON "meta_conversations"("meta_connected_account_id", "sender_identity_id");

CREATE UNIQUE INDEX "meta_conversations_lead_id_key"
    ON "meta_conversations"("lead_id");

CREATE INDEX "meta_conversations_meta_connected_account_id_last_message_a_idx"
    ON "meta_conversations"("meta_connected_account_id", "last_message_at");

CREATE INDEX "meta_conversations_sender_identity_id_idx"
    ON "meta_conversations"("sender_identity_id");

CREATE INDEX "meta_conversations_lead_id_idx"
    ON "meta_conversations"("lead_id");

CREATE UNIQUE INDEX "meta_messages_platform_meta_connected_account_id_provider_key"
    ON "meta_messages"("platform", "meta_connected_account_id", "provider_message_id");

CREATE INDEX "meta_messages_conversation_id_received_at_idx"
    ON "meta_messages"("conversation_id", "received_at");

ALTER TABLE "meta_sender_identities"
    ADD CONSTRAINT "meta_sender_identities_meta_connected_account_id_fkey"
    FOREIGN KEY ("meta_connected_account_id") REFERENCES "meta_connected_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meta_conversations"
    ADD CONSTRAINT "meta_conversations_meta_connected_account_id_fkey"
    FOREIGN KEY ("meta_connected_account_id") REFERENCES "meta_connected_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meta_conversations"
    ADD CONSTRAINT "meta_conversations_sender_identity_id_fkey"
    FOREIGN KEY ("sender_identity_id") REFERENCES "meta_sender_identities"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meta_conversations"
    ADD CONSTRAINT "meta_conversations_lead_id_fkey"
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meta_messages"
    ADD CONSTRAINT "meta_messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "meta_conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meta_messages"
    ADD CONSTRAINT "meta_messages_meta_connected_account_id_fkey"
    FOREIGN KEY ("meta_connected_account_id") REFERENCES "meta_connected_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

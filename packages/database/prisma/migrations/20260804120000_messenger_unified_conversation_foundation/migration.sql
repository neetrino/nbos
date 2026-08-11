-- Phase 3: additive unified Internal Messenger conversation foundation.
-- Legacy messenger_channels / messenger_direct_* tables are intentionally untouched.
-- No backfill. No dual-write.

-- CreateEnum
CREATE TYPE "MessengerConversationType" AS ENUM (
  'PROJECT_GENERAL',
  'PRODUCT',
  'DEAL',
  'TASK',
  'DIRECT',
  'INTERNAL_GROUP'
);

CREATE TYPE "MessengerConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'LOCKED');

CREATE TYPE "MessengerParticipantRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'READ_ONLY');

CREATE TYPE "MessengerLinkEntityType" AS ENUM ('PROJECT', 'PRODUCT', 'DEAL', 'TASK', 'WORKSPACE');

CREATE TYPE "MessengerLinkRelationType" AS ENUM ('PRIMARY', 'RELATED');

CREATE TYPE "MessengerMessageType" AS ENUM ('TEXT', 'SYSTEM');

-- CreateTable
CREATE TABLE "messenger_conversations" (
  "id" TEXT NOT NULL,
  "type" "MessengerConversationType" NOT NULL,
  "title" TEXT,
  "status" "MessengerConversationStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_by_id" TEXT,
  "canonical_key" TEXT,
  "direct_participant_low_id" TEXT,
  "direct_participant_high_id" TEXT,
  "metadata" JSONB,
  "last_message_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "messenger_conversations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "messenger_conversations_direct_pair_chk" CHECK (
    (
      "type" = 'DIRECT'
      AND "direct_participant_low_id" IS NOT NULL
      AND "direct_participant_high_id" IS NOT NULL
      AND "direct_participant_low_id" < "direct_participant_high_id"
    )
    OR (
      "type" <> 'DIRECT'
      AND "direct_participant_low_id" IS NULL
      AND "direct_participant_high_id" IS NULL
    )
  )
);

CREATE TABLE "messenger_conversation_participants" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "role" "MessengerParticipantRole" NOT NULL DEFAULT 'MEMBER',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "left_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "messenger_conversation_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messenger_conversation_links" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "entity_type" "MessengerLinkEntityType" NOT NULL,
  "entity_id" TEXT NOT NULL,
  "relation_type" "MessengerLinkRelationType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_conversation_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messenger_messages" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "sender_id" TEXT,
  "sender_name_snapshot" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "message_type" "MessengerMessageType" NOT NULL DEFAULT 'TEXT',
  "reply_to_message_id" TEXT,
  "edited_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "messenger_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messenger_message_attachments" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "file_asset_id" TEXT NOT NULL,
  "attached_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_message_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messenger_conversation_read_states" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "last_read_at" TIMESTAMP(3) NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "messenger_conversation_read_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messenger_user_conversation_settings" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "muted" BOOLEAN NOT NULL DEFAULT false,
  "favorite" BOOLEAN NOT NULL DEFAULT false,
  "last_opened_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "messenger_user_conversation_settings_pkey" PRIMARY KEY ("id")
);

-- Indexes / uniqueness
CREATE UNIQUE INDEX "messenger_conversations_canonical_key_key"
  ON "messenger_conversations"("canonical_key");

CREATE UNIQUE INDEX "messenger_conversations_direct_participant_low_id_direct_participant_high_id_key"
  ON "messenger_conversations"("direct_participant_low_id", "direct_participant_high_id");

CREATE INDEX "messenger_conversations_type_status_idx"
  ON "messenger_conversations"("type", "status");

CREATE INDEX "messenger_conversations_last_message_at_idx"
  ON "messenger_conversations"("last_message_at");

CREATE INDEX "messenger_conversations_status_updated_at_idx"
  ON "messenger_conversations"("status", "updated_at");

CREATE UNIQUE INDEX "messenger_conversation_participants_conversation_id_employee_id_key"
  ON "messenger_conversation_participants"("conversation_id", "employee_id");

CREATE INDEX "messenger_conversation_participants_employee_id_left_at_idx"
  ON "messenger_conversation_participants"("employee_id", "left_at");

CREATE INDEX "messenger_conversation_participants_conversation_id_left_at_idx"
  ON "messenger_conversation_participants"("conversation_id", "left_at");

CREATE INDEX "messenger_conversation_links_conversation_id_idx"
  ON "messenger_conversation_links"("conversation_id");

CREATE INDEX "messenger_conversation_links_entity_type_entity_id_idx"
  ON "messenger_conversation_links"("entity_type", "entity_id");

CREATE INDEX "messenger_conversation_links_entity_type_entity_id_relation_type_idx"
  ON "messenger_conversation_links"("entity_type", "entity_id", "relation_type");

CREATE UNIQUE INDEX "messenger_conversation_links_conversation_entity_relation_key"
  ON "messenger_conversation_links"("conversation_id", "entity_type", "entity_id", "relation_type");

-- One PRIMARY canonical chat per entity (Project General / Product / Deal / Task).
CREATE UNIQUE INDEX "messenger_conversation_links_primary_entity_key"
  ON "messenger_conversation_links"("entity_type", "entity_id")
  WHERE "relation_type" = 'PRIMARY';

CREATE INDEX "messenger_messages_conversation_id_created_at_idx"
  ON "messenger_messages"("conversation_id", "created_at");

CREATE INDEX "messenger_messages_sender_id_idx"
  ON "messenger_messages"("sender_id");

CREATE INDEX "messenger_messages_reply_to_message_id_idx"
  ON "messenger_messages"("reply_to_message_id");

CREATE UNIQUE INDEX "messenger_message_attachments_message_id_file_asset_id_key"
  ON "messenger_message_attachments"("message_id", "file_asset_id");

CREATE INDEX "messenger_message_attachments_file_asset_id_idx"
  ON "messenger_message_attachments"("file_asset_id");

CREATE UNIQUE INDEX "messenger_conversation_read_states_conversation_id_employee_id_key"
  ON "messenger_conversation_read_states"("conversation_id", "employee_id");

CREATE INDEX "messenger_conversation_read_states_employee_id_idx"
  ON "messenger_conversation_read_states"("employee_id");

CREATE UNIQUE INDEX "messenger_user_conversation_settings_conversation_id_employee_id_key"
  ON "messenger_user_conversation_settings"("conversation_id", "employee_id");

CREATE INDEX "messenger_user_conversation_settings_employee_id_pinned_idx"
  ON "messenger_user_conversation_settings"("employee_id", "pinned");

CREATE INDEX "messenger_user_conversation_settings_employee_id_favorite_idx"
  ON "messenger_user_conversation_settings"("employee_id", "favorite");

-- Foreign keys
ALTER TABLE "messenger_conversations"
  ADD CONSTRAINT "messenger_conversations_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messenger_conversations"
  ADD CONSTRAINT "messenger_conversations_direct_participant_low_id_fkey"
  FOREIGN KEY ("direct_participant_low_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_conversations"
  ADD CONSTRAINT "messenger_conversations_direct_participant_high_id_fkey"
  FOREIGN KEY ("direct_participant_high_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_conversation_participants"
  ADD CONSTRAINT "messenger_conversation_participants_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_conversation_participants"
  ADD CONSTRAINT "messenger_conversation_participants_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_conversation_links"
  ADD CONSTRAINT "messenger_conversation_links_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_messages"
  ADD CONSTRAINT "messenger_messages_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_messages"
  ADD CONSTRAINT "messenger_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_messages"
  ADD CONSTRAINT "messenger_messages_reply_to_message_id_fkey"
  FOREIGN KEY ("reply_to_message_id") REFERENCES "messenger_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messenger_message_attachments"
  ADD CONSTRAINT "messenger_message_attachments_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "messenger_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_message_attachments"
  ADD CONSTRAINT "messenger_message_attachments_file_asset_id_fkey"
  FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_message_attachments"
  ADD CONSTRAINT "messenger_message_attachments_attached_by_id_fkey"
  FOREIGN KEY ("attached_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messenger_conversation_read_states"
  ADD CONSTRAINT "messenger_conversation_read_states_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_conversation_read_states"
  ADD CONSTRAINT "messenger_conversation_read_states_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_user_conversation_settings"
  ADD CONSTRAINT "messenger_user_conversation_settings_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_user_conversation_settings"
  ADD CONSTRAINT "messenger_user_conversation_settings_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

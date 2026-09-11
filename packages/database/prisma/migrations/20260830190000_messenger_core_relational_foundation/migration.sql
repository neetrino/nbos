-- Slice 1: evolve Unified Conversation/Message tables into Messaging Core.
-- Additive only. Does not drop Channel/DM, Unified, Meta, or Task discussion.

-- ── Enums ──────────────────────────────────────────────────
CREATE TYPE "MessengerConversationZone" AS ENUM ('INTERNAL', 'CLIENT');
CREATE TYPE "MessengerConversationKind" AS ENUM ('DIRECT', 'GROUP', 'ENTITY', 'EXTERNAL');
CREATE TYPE "MessengerMessageDirection" AS ENUM ('INTERNAL', 'INBOUND', 'OUTBOUND');
CREATE TYPE "MessengerMessageStatus" AS ENUM (
  'QUEUED',
  'SENDING',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
  'OUTCOME_UNKNOWN',
  'CANCELLED'
);
CREATE TYPE "MessengerMessageProvenance" AS ENUM ('EMPLOYEE', 'SYSTEM', 'PROVIDER', 'AI');
CREATE TYPE "MessengerMessageReferencePurpose" AS ENUM (
  'FORWARD',
  'TASK_SOURCE',
  'TICKET_SOURCE',
  'DEAL_SOURCE'
);
CREATE TYPE "MessengerExternalProvider" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'FACEBOOK');
CREATE TYPE "MessengerCommandKind" AS ENUM ('SEND_MESSAGE', 'MARK_READ', 'ADD_REFERENCE');
CREATE TYPE "MessengerCommandStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "MessengerLegacyIdentityKind" AS ENUM (
  'CHANNEL',
  'DIRECT_THREAD',
  'CHANNEL_MESSAGE',
  'DIRECT_MESSAGE'
);

ALTER TYPE "MessengerConversationType" ADD VALUE 'EXTERNAL';
ALTER TYPE "MessengerLinkEntityType" ADD VALUE 'TICKET';
ALTER TYPE "MessengerLinkEntityType" ADD VALUE 'CLIENT';

-- ── Conversation zone/kind ─────────────────────────────────
ALTER TABLE "messenger_conversations"
  ADD COLUMN "zone" "MessengerConversationZone" NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN "kind" "MessengerConversationKind" NOT NULL DEFAULT 'ENTITY';

ALTER TABLE "messenger_conversations"
  ADD CONSTRAINT "messenger_conversations_zone_kind_type_chk" CHECK (
    (
      "zone" = 'INTERNAL'
      AND "type" IN (
        'PROJECT_GENERAL',
        'PRODUCT',
        'DEAL',
        'TASK',
        'DIRECT',
        'INTERNAL_GROUP'
      )
      AND (
        ("type" = 'DIRECT' AND "kind" = 'DIRECT')
        OR ("type" = 'INTERNAL_GROUP' AND "kind" = 'GROUP')
        OR (
          "type" IN ('PROJECT_GENERAL', 'PRODUCT', 'DEAL', 'TASK')
          AND "kind" = 'ENTITY'
        )
      )
    )
    OR (
      "zone" = 'CLIENT'
      AND "kind" = 'EXTERNAL'
    )
  );

CREATE INDEX "messenger_conversations_zone_status_idx"
  ON "messenger_conversations"("zone", "status");

CREATE OR REPLACE FUNCTION public.messenger_conversation_zone_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.zone IS DISTINCT FROM OLD.zone THEN
    RAISE EXCEPTION 'Conversation.zone is immutable';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER messenger_conversation_zone_immutable_trg
  BEFORE UPDATE ON public.messenger_conversations
  FOR EACH ROW
  EXECUTE FUNCTION messenger_conversation_zone_immutable();

CREATE OR REPLACE FUNCTION public.messenger_conversation_zone_type_align()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.zone::text = 'CLIENT' AND NEW.type::text <> 'EXTERNAL' THEN
    RAISE EXCEPTION 'CLIENT conversations must have type EXTERNAL';
  END IF;
  IF NEW.zone::text = 'INTERNAL' AND NEW.type::text = 'EXTERNAL' THEN
    RAISE EXCEPTION 'INTERNAL conversations cannot have type EXTERNAL';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER messenger_conversation_zone_type_align_trg
  BEFORE INSERT OR UPDATE ON public.messenger_conversations
  FOR EACH ROW
  EXECUTE FUNCTION messenger_conversation_zone_type_align();

-- ── Message direction/status/provenance/thread/idempotency ─
ALTER TABLE "messenger_messages"
  ADD COLUMN "direction" "MessengerMessageDirection" NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN "status" "MessengerMessageStatus" NOT NULL DEFAULT 'SENT',
  ADD COLUMN "provenance" "MessengerMessageProvenance" NOT NULL DEFAULT 'EMPLOYEE',
  ADD COLUMN "thread_root_message_id" TEXT,
  ADD COLUMN "idempotency_key" TEXT;

ALTER TABLE "messenger_messages"
  ADD CONSTRAINT "messenger_messages_thread_root_message_id_fkey"
  FOREIGN KEY ("thread_root_message_id")
  REFERENCES "messenger_messages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "messenger_messages_conversation_id_idempotency_key_key"
  ON "messenger_messages"("conversation_id", "idempotency_key");

CREATE INDEX "messenger_messages_thread_root_message_id_idx"
  ON "messenger_messages"("thread_root_message_id");

CREATE OR REPLACE FUNCTION public.messenger_message_zone_direction()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  conv_zone "MessengerConversationZone";
BEGIN
  IF NEW.conversation_id IS NULL THEN
    RAISE EXCEPTION 'Message requires a conversation';
  END IF;

  SELECT zone INTO conv_zone
  FROM "messenger_conversations"
  WHERE id = NEW.conversation_id;

  IF conv_zone IS NULL THEN
    RAISE EXCEPTION 'Message requires an existing conversation';
  END IF;

  IF conv_zone = 'INTERNAL' AND NEW.direction <> 'INTERNAL' THEN
    RAISE EXCEPTION 'Internal conversation messages must have direction INTERNAL';
  END IF;

  IF conv_zone = 'CLIENT' AND NEW.direction = 'INTERNAL' THEN
    RAISE EXCEPTION 'Client conversation messages cannot use INTERNAL direction';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER messenger_message_zone_direction_trg
  BEFORE INSERT OR UPDATE ON public.messenger_messages
  FOR EACH ROW
  EXECUTE FUNCTION messenger_message_zone_direction();

-- ── External mapping (CLIENT zone only; no Product-owned provider ids)
CREATE TABLE "messenger_external_conversation_mappings" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "provider" "MessengerExternalProvider" NOT NULL,
  "external_account_id" TEXT NOT NULL,
  "external_conversation_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "messenger_external_conversation_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_external_conversation_mappings_conversation_id_pr_key"
  ON "messenger_external_conversation_mappings"("conversation_id", "provider");

CREATE UNIQUE INDEX "messenger_external_conversation_mappings_provider_external__key"
  ON "messenger_external_conversation_mappings"("provider", "external_account_id", "external_conversation_id");

ALTER TABLE "messenger_external_conversation_mappings"
  ADD CONSTRAINT "messenger_external_conversation_mappings_conversation_id_fkey"
  FOREIGN KEY ("conversation_id")
  REFERENCES "messenger_conversations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.messenger_external_mapping_client_zone_only()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  conv_zone "MessengerConversationZone";
BEGIN
  SELECT zone INTO conv_zone
  FROM "messenger_conversations"
  WHERE id = NEW.conversation_id;

  IF conv_zone IS DISTINCT FROM 'CLIENT' THEN
    RAISE EXCEPTION 'Provider mapping is allowed only on CLIENT conversations';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER messenger_external_mapping_client_zone_only_trg
  BEFORE INSERT OR UPDATE ON public.messenger_external_conversation_mappings
  FOR EACH ROW
  EXECUTE FUNCTION messenger_external_mapping_client_zone_only();

-- ── Command/idempotency hook (no Gateway dispatch in Slice 1)
CREATE TABLE "messenger_commands" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT,
  "actor_employee_id" TEXT,
  "kind" "MessengerCommandKind" NOT NULL,
  "status" "MessengerCommandStatus" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" TEXT NOT NULL,
  "payload" JSONB,
  "result_message_id" TEXT,
  "error_code" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),

  CONSTRAINT "messenger_commands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_commands_idempotency_key_key"
  ON "messenger_commands"("idempotency_key");

CREATE INDEX "messenger_commands_conversation_id_created_at_idx"
  ON "messenger_commands"("conversation_id", "created_at");

CREATE INDEX "messenger_commands_status_idx"
  ON "messenger_commands"("status");

ALTER TABLE "messenger_commands"
  ADD CONSTRAINT "messenger_commands_conversation_id_fkey"
  FOREIGN KEY ("conversation_id")
  REFERENCES "messenger_conversations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messenger_commands"
  ADD CONSTRAINT "messenger_commands_actor_employee_id_fkey"
  FOREIGN KEY ("actor_employee_id")
  REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messenger_commands"
  ADD CONSTRAINT "messenger_commands_result_message_id_fkey"
  FOREIGN KEY ("result_message_id")
  REFERENCES "messenger_messages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Message references (source remains canonical)
CREATE TABLE "messenger_message_references" (
  "id" TEXT NOT NULL,
  "source_conversation_id" TEXT NOT NULL,
  "source_message_id" TEXT NOT NULL,
  "target_conversation_id" TEXT,
  "target_message_id" TEXT,
  "purpose" "MessengerMessageReferencePurpose" NOT NULL,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_message_references_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messenger_message_references_source_message_id_idx"
  ON "messenger_message_references"("source_message_id");

CREATE INDEX "messenger_message_references_purpose_entity_type_entity_id_idx"
  ON "messenger_message_references"("purpose", "entity_type", "entity_id");

CREATE INDEX "messenger_message_references_target_message_id_idx"
  ON "messenger_message_references"("target_message_id");

ALTER TABLE "messenger_message_references"
  ADD CONSTRAINT "messenger_message_references_source_message_id_fkey"
  FOREIGN KEY ("source_message_id")
  REFERENCES "messenger_messages"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_message_references"
  ADD CONSTRAINT "messenger_message_references_source_conversation_id_fkey"
  FOREIGN KEY ("source_conversation_id")
  REFERENCES "messenger_conversations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_message_references"
  ADD CONSTRAINT "messenger_message_references_target_message_id_fkey"
  FOREIGN KEY ("target_message_id")
  REFERENCES "messenger_messages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messenger_message_references"
  ADD CONSTRAINT "messenger_message_references_target_conversation_id_fkey"
  FOREIGN KEY ("target_conversation_id")
  REFERENCES "messenger_conversations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messenger_message_references"
  ADD CONSTRAINT "messenger_message_references_created_by_id_fkey"
  FOREIGN KEY ("created_by_id")
  REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Reactions (optional; threads are not mandatory)
CREATE TABLE "messenger_message_reactions" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_message_reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_message_reactions_message_id_employee_id_emoji_key"
  ON "messenger_message_reactions"("message_id", "employee_id", "emoji");

CREATE INDEX "messenger_message_reactions_employee_id_idx"
  ON "messenger_message_reactions"("employee_id");

ALTER TABLE "messenger_message_reactions"
  ADD CONSTRAINT "messenger_message_reactions_message_id_fkey"
  FOREIGN KEY ("message_id")
  REFERENCES "messenger_messages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_message_reactions"
  ADD CONSTRAINT "messenger_message_reactions_employee_id_fkey"
  FOREIGN KEY ("employee_id")
  REFERENCES "employees"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Legacy Channel/DM → Core identity map (scheduled mapping)
CREATE TABLE "messenger_legacy_identities" (
  "id" TEXT NOT NULL,
  "source_kind" "MessengerLegacyIdentityKind" NOT NULL,
  "source_id" TEXT NOT NULL,
  "conversation_id" TEXT,
  "message_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_legacy_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_legacy_identities_source_kind_source_id_key"
  ON "messenger_legacy_identities"("source_kind", "source_id");

CREATE INDEX "messenger_legacy_identities_conversation_id_idx"
  ON "messenger_legacy_identities"("conversation_id");

CREATE INDEX "messenger_legacy_identities_message_id_idx"
  ON "messenger_legacy_identities"("message_id");

ALTER TABLE "messenger_legacy_identities"
  ADD CONSTRAINT "messenger_legacy_identities_conversation_id_fkey"
  FOREIGN KEY ("conversation_id")
  REFERENCES "messenger_conversations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

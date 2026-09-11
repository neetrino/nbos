-- Slice 9: ProductCommunicationBinding (WORK | FINANCE) + legacy WORK backfill.
-- Additive only. Does not DROP ProductWhatsAppGroupBinding / unique groupChatId.
-- Accountant accounting_group_chat_id is never collapsed into Product WORK/FINANCE.
-- Idempotent / rerunnable: INSERT … ON CONFLICT / WHERE NOT EXISTS.

ALTER TYPE "WhatsAppGroupOperationTypeEnum" ADD VALUE IF NOT EXISTS 'CREATE_FINANCE_GROUP';

DO $$ BEGIN
  CREATE TYPE "ProductCommunicationPurpose" AS ENUM ('WORK', 'FINANCE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProductCommunicationBindingStatus" AS ENUM ('ACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "product_communication_bindings" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "purpose" "ProductCommunicationPurpose" NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "status" "ProductCommunicationBindingStatus" NOT NULL DEFAULT 'ACTIVE',
  "legacy_binding_id" TEXT,
  "created_from_deal_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_communication_bindings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_communication_bindings_product_purpose_key"
  ON "product_communication_bindings" ("product_id", "purpose");

CREATE INDEX IF NOT EXISTS "product_communication_bindings_conversation_id_idx"
  ON "product_communication_bindings" ("conversation_id");

CREATE INDEX IF NOT EXISTS "product_communication_bindings_legacy_binding_id_idx"
  ON "product_communication_bindings" ("legacy_binding_id");

CREATE INDEX IF NOT EXISTS "product_communication_bindings_created_from_deal_id_idx"
  ON "product_communication_bindings" ("created_from_deal_id");

DO $$ BEGIN
  ALTER TABLE "product_communication_bindings"
    ADD CONSTRAINT "product_communication_bindings_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_communication_bindings"
    ADD CONSTRAINT "product_communication_bindings_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_communication_bindings"
    ADD CONSTRAINT "product_communication_bindings_legacy_binding_id_fkey"
    FOREIGN KEY ("legacy_binding_id") REFERENCES "product_whatsapp_group_bindings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_communication_bindings"
    ADD CONSTRAINT "product_communication_bindings_created_from_deal_id_fkey"
    FOREIGN KEY ("created_from_deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backfill: one External Conversation + WHATSAPP mapping per physical group, then WORK rows.
-- No FINANCE rows. Skip accountant group. Reuse existing Slice 8 conversations/mappings.
WITH account AS (
  SELECT
    COALESCE(
      (
        SELECT NULLIF(BTRIM(g."gateway_account_id"), '')
        FROM "whatsapp_gateway_connections" g
        LIMIT 1
      ),
      'default'
    ) AS account_id,
    (
      SELECT NULLIF(BTRIM(g."accounting_group_chat_id"), '')
      FROM "whatsapp_gateway_connections" g
      LIMIT 1
    ) AS accountant_chat_id
),
legacy_groups AS (
  SELECT
    b."group_chat_id" AS chat_id,
    MAX(b."group_name") AS group_name
  FROM "product_whatsapp_group_bindings" b
  CROSS JOIN account a
  WHERE b."group_chat_id" IS NOT NULL
    AND b."group_chat_id" IS DISTINCT FROM a.accountant_chat_id
  GROUP BY b."group_chat_id"
),
inserted_conversations AS (
  INSERT INTO "messenger_conversations" (
    "id",
    "zone",
    "kind",
    "type",
    "title",
    "status",
    "canonical_key",
    "metadata",
    "created_at",
    "updated_at"
  )
  SELECT
    gen_random_uuid()::text,
    'CLIENT',
    'EXTERNAL',
    'EXTERNAL',
    lg.group_name,
    'ACTIVE',
    'wa:' || a.account_id || ':' || lg.chat_id,
    jsonb_build_object(
      'whatsAppAccountId', a.account_id,
      'whatsAppChatId', lg.chat_id
    ),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM legacy_groups lg
  CROSS JOIN account a
  WHERE NOT EXISTS (
    SELECT 1
    FROM "messenger_conversations" mc
    WHERE mc."canonical_key" = 'wa:' || a.account_id || ':' || lg.chat_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "messenger_external_conversation_mappings" m
    WHERE m."provider" = 'WHATSAPP'
      AND m."external_account_id" = a.account_id
      AND m."external_conversation_id" = lg.chat_id
  )
  ON CONFLICT ("canonical_key") DO NOTHING
  RETURNING "id", "canonical_key"
)
INSERT INTO "messenger_external_conversation_mappings" (
  "id",
  "conversation_id",
  "provider",
  "external_account_id",
  "external_conversation_id",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  resolved.conversation_id,
  'WHATSAPP',
  a.account_id,
  lg.chat_id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy_groups lg
CROSS JOIN account a
CROSS JOIN LATERAL (
  SELECT COALESCE(
    (
      SELECT m."conversation_id"
      FROM "messenger_external_conversation_mappings" m
      WHERE m."provider" = 'WHATSAPP'
        AND m."external_account_id" = a.account_id
        AND m."external_conversation_id" = lg.chat_id
      LIMIT 1
    ),
    (
      SELECT mc."id"
      FROM "messenger_conversations" mc
      WHERE mc."canonical_key" = 'wa:' || a.account_id || ':' || lg.chat_id
      LIMIT 1
    ),
    (
      SELECT ic."id"
      FROM inserted_conversations ic
      WHERE ic."canonical_key" = 'wa:' || a.account_id || ':' || lg.chat_id
      LIMIT 1
    )
  ) AS conversation_id
) resolved
WHERE resolved.conversation_id IS NOT NULL
ON CONFLICT ("provider", "external_account_id", "external_conversation_id") DO NOTHING;

INSERT INTO "product_communication_bindings" (
  "id",
  "product_id",
  "purpose",
  "conversation_id",
  "status",
  "legacy_binding_id",
  "created_from_deal_id",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  b."product_id",
  'WORK',
  resolved.conversation_id,
  'ACTIVE',
  b."id",
  b."created_from_deal_id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "product_whatsapp_group_bindings" b
CROSS JOIN LATERAL (
  SELECT
    COALESCE(
      (
        SELECT NULLIF(BTRIM(g."gateway_account_id"), '')
        FROM "whatsapp_gateway_connections" g
        LIMIT 1
      ),
      'default'
    ) AS account_id,
    (
      SELECT NULLIF(BTRIM(g."accounting_group_chat_id"), '')
      FROM "whatsapp_gateway_connections" g
      LIMIT 1
    ) AS accountant_chat_id
) a
CROSS JOIN LATERAL (
  SELECT COALESCE(
    (
      SELECT m."conversation_id"
      FROM "messenger_external_conversation_mappings" m
      WHERE m."provider" = 'WHATSAPP'
        AND m."external_account_id" = a.account_id
        AND m."external_conversation_id" = b."group_chat_id"
      LIMIT 1
    ),
    (
      SELECT mc."id"
      FROM "messenger_conversations" mc
      WHERE mc."canonical_key" = 'wa:' || a.account_id || ':' || b."group_chat_id"
      LIMIT 1
    )
  ) AS conversation_id
) resolved
WHERE b."group_chat_id" IS NOT NULL
  AND b."group_chat_id" IS DISTINCT FROM a.accountant_chat_id
  AND resolved.conversation_id IS NOT NULL
ON CONFLICT ("product_id", "purpose") DO NOTHING;

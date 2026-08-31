-- Slice 10: additive attention routing (M-ROUTING-01).
-- Does not DROP ProductWhatsAppGroupBinding, Channel/DM, Task discussion, or Meta.
-- Defaults are computed at read time; this table stores manual overrides only.

DO $$ BEGIN
  CREATE TYPE "MessengerAttentionOwnerKind" AS ENUM ('EMPLOYEE', 'QUEUE', 'ROLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MessengerAttentionQueue" AS ENUM ('SUPPORT_INTAKE', 'FINANCE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MessengerAttentionRole" AS ENUM ('PRODUCT_PM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "messenger_conversation_attentions" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "purpose" "ProductCommunicationPurpose" NOT NULL,
  "owner_kind" "MessengerAttentionOwnerKind" NOT NULL,
  "owner_employee_id" TEXT,
  "owner_queue" "MessengerAttentionQueue",
  "owner_role" "MessengerAttentionRole",
  "assigned_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messenger_conversation_attentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "messenger_conversation_attentions_scope_key"
  ON "messenger_conversation_attentions" ("conversation_id", "product_id", "purpose");

CREATE INDEX IF NOT EXISTS "messenger_conversation_attentions_conversation_id_idx"
  ON "messenger_conversation_attentions" ("conversation_id");

CREATE INDEX IF NOT EXISTS "messenger_conversation_attentions_product_id_idx"
  ON "messenger_conversation_attentions" ("product_id");

CREATE INDEX IF NOT EXISTS "messenger_conversation_attentions_owner_employee_id_idx"
  ON "messenger_conversation_attentions" ("owner_employee_id");

DO $$ BEGIN
  ALTER TABLE "messenger_conversation_attentions"
    ADD CONSTRAINT "messenger_conversation_attentions_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messenger_conversation_attentions"
    ADD CONSTRAINT "messenger_conversation_attentions_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messenger_conversation_attentions"
    ADD CONSTRAINT "messenger_conversation_attentions_owner_employee_id_fkey"
    FOREIGN KEY ("owner_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messenger_conversation_attentions"
    ADD CONSTRAINT "messenger_conversation_attentions_assigned_by_id_fkey"
    FOREIGN KEY ("assigned_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

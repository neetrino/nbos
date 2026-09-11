-- Deal-level client WhatsApp group (pre-Product). Bound to Product WORK on Won.

CREATE TABLE "deal_whatsapp_group_bindings" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "group_chat_id" TEXT,
    "group_name" TEXT,
    "status" "ProductWhatsAppGroupBindingStatusEnum" NOT NULL DEFAULT 'PENDING',
    "last_successful_sync_at" TIMESTAMP(3),
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_whatsapp_group_bindings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_whatsapp_group_bindings_deal_id_key"
    ON "deal_whatsapp_group_bindings"("deal_id");

CREATE UNIQUE INDEX "deal_whatsapp_group_bindings_group_chat_id_key"
    ON "deal_whatsapp_group_bindings"("group_chat_id");

CREATE INDEX "deal_whatsapp_group_bindings_status_idx"
    ON "deal_whatsapp_group_bindings"("status");

ALTER TABLE "deal_whatsapp_group_bindings"
    ADD CONSTRAINT "deal_whatsapp_group_bindings_deal_id_fkey"
    FOREIGN KEY ("deal_id") REFERENCES "deals"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

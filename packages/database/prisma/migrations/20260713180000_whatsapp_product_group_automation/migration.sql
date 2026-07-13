-- WhatsApp Gateway connection + Product WhatsApp group automation

CREATE TYPE "WhatsAppGatewayConnectionStatusEnum" AS ENUM (
  'NOT_CONFIGURED',
  'CONNECTED',
  'DISCONNECTED',
  'ERROR'
);

CREATE TYPE "ProductWhatsAppGroupBindingStatusEnum" AS ENUM (
  'PENDING',
  'CREATING',
  'ACTIVE',
  'FAILED',
  'OUTCOME_UNKNOWN',
  'NEEDS_RECONCILIATION'
);

CREATE TYPE "WhatsAppGroupOperationTypeEnum" AS ENUM (
  'CREATE_PRODUCT_GROUP',
  'BIND_EXISTING_GROUP',
  'SYNC_PRODUCT_PARTICIPANTS',
  'ADD_PRODUCT_PARTICIPANT',
  'SEND_CLIENT_INVITE'
);

CREATE TYPE "WhatsAppGroupOperationStatusEnum" AS ENUM (
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'OUTCOME_UNKNOWN',
  'SKIPPED'
);

CREATE TYPE "WhatsAppGroupOperationSourceEnum" AS ENUM (
  'PRODUCT_CREATED',
  'DEAL_ACTION',
  'DEAL_WON',
  'EARLY_DELIVERY',
  'RECONCILIATION',
  'MANUAL_RETRY',
  'DEVELOPMENT_TS',
  'MANUAL_BIND',
  'MANUAL_SYNC',
  'MANUAL_INVITE'
);

CREATE TYPE "ProductWhatsAppParticipantSyncStatusEnum" AS ENUM (
  'PENDING',
  'ADDED',
  'ALREADY_MEMBER',
  'SKIPPED_NO_PHONE',
  'SKIPPED_INVALID_PHONE',
  'FAILED'
);

CREATE TYPE "ProductWhatsAppClientInvitationStatusEnum" AS ENUM (
  'PENDING',
  'QUEUED',
  'SENT',
  'FAILED',
  'SKIPPED_NO_CONTACT',
  'SKIPPED_NO_PHONE',
  'OUTCOME_UNKNOWN'
);

CREATE TABLE "whatsapp_gateway_connections" (
  "id" TEXT NOT NULL,
  "base_url" TEXT,
  "encrypted_api_token" TEXT,
  "status" "WhatsAppGatewayConnectionStatusEnum" NOT NULL DEFAULT 'NOT_CONFIGURED',
  "last_health_check_at" TIMESTAMP(3),
  "last_connected_at" TIMESTAMP(3),
  "last_error_code" TEXT,
  "last_error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "whatsapp_gateway_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_whatsapp_group_bindings" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "group_chat_id" TEXT,
  "group_name" TEXT,
  "status" "ProductWhatsAppGroupBindingStatusEnum" NOT NULL DEFAULT 'PENDING',
  "created_from_deal_id" TEXT,
  "last_successful_sync_at" TIMESTAMP(3),
  "last_error_code" TEXT,
  "last_error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_whatsapp_group_bindings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_group_operations" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "binding_id" TEXT,
  "type" "WhatsAppGroupOperationTypeEnum" NOT NULL,
  "status" "WhatsAppGroupOperationStatusEnum" NOT NULL DEFAULT 'PENDING',
  "dedupe_key" TEXT NOT NULL,
  "source" "WhatsAppGroupOperationSourceEnum" NOT NULL,
  "context_deal_id" TEXT,
  "requested_by_id" TEXT,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "gateway_request_id" TEXT,
  "safe_payload" JSONB,
  "result_metadata" JSONB,
  "error_code" TEXT,
  "error_message" TEXT,
  "queued_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "whatsapp_group_operations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_whatsapp_participant_syncs" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "binding_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "source_roles" JSONB NOT NULL,
  "status" "ProductWhatsAppParticipantSyncStatusEnum" NOT NULL DEFAULT 'PENDING',
  "last_attempt_at" TIMESTAMP(3),
  "added_at" TIMESTAMP(3),
  "last_error_code" TEXT,
  "last_error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_whatsapp_participant_syncs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_whatsapp_client_invitations" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "binding_id" TEXT NOT NULL,
  "contact_id" TEXT,
  "status" "ProductWhatsAppClientInvitationStatusEnum" NOT NULL DEFAULT 'PENDING',
  "dedupe_key" TEXT NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "sent_at" TIMESTAMP(3),
  "last_attempt_at" TIMESTAMP(3),
  "last_error_code" TEXT,
  "last_error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_whatsapp_client_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_whatsapp_group_bindings_product_id_key" ON "product_whatsapp_group_bindings"("product_id");
CREATE UNIQUE INDEX "product_whatsapp_group_bindings_group_chat_id_key" ON "product_whatsapp_group_bindings"("group_chat_id");
CREATE INDEX "product_whatsapp_group_bindings_status_idx" ON "product_whatsapp_group_bindings"("status");
CREATE INDEX "product_whatsapp_group_bindings_created_from_deal_id_idx" ON "product_whatsapp_group_bindings"("created_from_deal_id");

CREATE UNIQUE INDEX "whatsapp_group_operations_dedupe_key_key" ON "whatsapp_group_operations"("dedupe_key");
CREATE INDEX "whatsapp_group_operations_product_id_type_status_idx" ON "whatsapp_group_operations"("product_id", "type", "status");
CREATE INDEX "whatsapp_group_operations_status_queued_at_idx" ON "whatsapp_group_operations"("status", "queued_at");
CREATE INDEX "whatsapp_group_operations_binding_id_idx" ON "whatsapp_group_operations"("binding_id");

CREATE UNIQUE INDEX "product_whatsapp_participant_syncs_binding_id_employee_id_key" ON "product_whatsapp_participant_syncs"("binding_id", "employee_id");
CREATE INDEX "product_whatsapp_participant_syncs_product_id_idx" ON "product_whatsapp_participant_syncs"("product_id");
CREATE INDEX "product_whatsapp_participant_syncs_employee_id_idx" ON "product_whatsapp_participant_syncs"("employee_id");
CREATE INDEX "product_whatsapp_participant_syncs_status_idx" ON "product_whatsapp_participant_syncs"("status");

CREATE UNIQUE INDEX "product_whatsapp_client_invitations_dedupe_key_key" ON "product_whatsapp_client_invitations"("dedupe_key");
CREATE INDEX "product_whatsapp_client_invitations_product_id_idx" ON "product_whatsapp_client_invitations"("product_id");
CREATE INDEX "product_whatsapp_client_invitations_binding_id_idx" ON "product_whatsapp_client_invitations"("binding_id");
CREATE INDEX "product_whatsapp_client_invitations_contact_id_idx" ON "product_whatsapp_client_invitations"("contact_id");
CREATE INDEX "product_whatsapp_client_invitations_status_idx" ON "product_whatsapp_client_invitations"("status");

ALTER TABLE "product_whatsapp_group_bindings"
  ADD CONSTRAINT "product_whatsapp_group_bindings_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_whatsapp_group_bindings"
  ADD CONSTRAINT "product_whatsapp_group_bindings_created_from_deal_id_fkey"
  FOREIGN KEY ("created_from_deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_group_operations"
  ADD CONSTRAINT "whatsapp_group_operations_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_group_operations"
  ADD CONSTRAINT "whatsapp_group_operations_binding_id_fkey"
  FOREIGN KEY ("binding_id") REFERENCES "product_whatsapp_group_bindings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_group_operations"
  ADD CONSTRAINT "whatsapp_group_operations_context_deal_id_fkey"
  FOREIGN KEY ("context_deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_group_operations"
  ADD CONSTRAINT "whatsapp_group_operations_requested_by_id_fkey"
  FOREIGN KEY ("requested_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_whatsapp_participant_syncs"
  ADD CONSTRAINT "product_whatsapp_participant_syncs_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_whatsapp_participant_syncs"
  ADD CONSTRAINT "product_whatsapp_participant_syncs_binding_id_fkey"
  FOREIGN KEY ("binding_id") REFERENCES "product_whatsapp_group_bindings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_whatsapp_participant_syncs"
  ADD CONSTRAINT "product_whatsapp_participant_syncs_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_whatsapp_client_invitations"
  ADD CONSTRAINT "product_whatsapp_client_invitations_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_whatsapp_client_invitations"
  ADD CONSTRAINT "product_whatsapp_client_invitations_binding_id_fkey"
  FOREIGN KEY ("binding_id") REFERENCES "product_whatsapp_group_bindings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_whatsapp_client_invitations"
  ADD CONSTRAINT "product_whatsapp_client_invitations_contact_id_fkey"
  FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

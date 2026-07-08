-- Meta integration MVP: connected accounts, encrypted secrets, webhook idempotency events.

CREATE TYPE "IntegrationProviderEnum" AS ENUM ('META');

CREATE TYPE "MetaPlatformEnum" AS ENUM ('INSTAGRAM', 'FACEBOOK');

CREATE TYPE "MetaConnectedAccountStatusEnum" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

CREATE TABLE "meta_connected_accounts" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProviderEnum" NOT NULL DEFAULT 'META',
    "platform" "MetaPlatformEnum" NOT NULL,
    "display_name" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "instagram_business_account_id" TEXT,
    "external_account_id" TEXT NOT NULL,
    "marketing_account_id" TEXT,
    "connected_by_user_id" TEXT NOT NULL,
    "status" "MetaConnectedAccountStatusEnum" NOT NULL DEFAULT 'CONNECTED',
    "token_expires_at" TIMESTAMP(3),
    "scopes" JSONB,
    "last_error_at" TIMESTAMP(3),
    "last_error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_connected_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_provider_secrets" (
    "id" TEXT NOT NULL,
    "meta_connected_account_id" TEXT NOT NULL,
    "encrypted_secret" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_provider_secrets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_provider_events" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProviderEnum" NOT NULL DEFAULT 'META',
    "event_id" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "event_type" TEXT,
    "lead_id" TEXT,
    "processed_at" TIMESTAMP(3),
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_provider_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meta_connected_accounts_provider_external_account_id_key"
    ON "meta_connected_accounts"("provider", "external_account_id");

CREATE INDEX "meta_connected_accounts_marketing_account_id_idx"
    ON "meta_connected_accounts"("marketing_account_id");

CREATE INDEX "meta_connected_accounts_status_idx"
    ON "meta_connected_accounts"("status");

CREATE INDEX "meta_connected_accounts_page_id_idx"
    ON "meta_connected_accounts"("page_id");

CREATE INDEX "meta_connected_accounts_instagram_business_account_id_idx"
    ON "meta_connected_accounts"("instagram_business_account_id");

CREATE UNIQUE INDEX "meta_provider_secrets_meta_connected_account_id_key"
    ON "meta_provider_secrets"("meta_connected_account_id");

CREATE UNIQUE INDEX "meta_provider_events_provider_event_id_key"
    ON "meta_provider_events"("provider", "event_id");

CREATE INDEX "meta_provider_events_object_id_idx"
    ON "meta_provider_events"("object_id");

CREATE INDEX "meta_provider_events_lead_id_idx"
    ON "meta_provider_events"("lead_id");

ALTER TABLE "meta_connected_accounts"
    ADD CONSTRAINT "meta_connected_accounts_marketing_account_id_fkey"
    FOREIGN KEY ("marketing_account_id") REFERENCES "marketing_accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meta_connected_accounts"
    ADD CONSTRAINT "meta_connected_accounts_connected_by_user_id_fkey"
    FOREIGN KEY ("connected_by_user_id") REFERENCES "employees"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meta_provider_secrets"
    ADD CONSTRAINT "meta_provider_secrets_meta_connected_account_id_fkey"
    FOREIGN KEY ("meta_connected_account_id") REFERENCES "meta_connected_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meta_provider_events"
    ADD CONSTRAINT "meta_provider_events_lead_id_fkey"
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

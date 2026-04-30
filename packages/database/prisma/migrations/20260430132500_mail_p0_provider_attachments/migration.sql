-- Mail P0: provider connection boundary and Drive-backed email attachments.

CREATE TYPE "MailProviderConnectionStatus" AS ENUM (
  'NOT_CONNECTED',
  'CONNECTED',
  'DEGRADED',
  'NEEDS_RECONNECT',
  'PAUSED'
);

CREATE TYPE "EmailAttachmentDownloadStatus" AS ENUM (
  'PENDING',
  'READY',
  'FAILED'
);

CREATE TABLE "mail_provider_connections" (
  "id" TEXT NOT NULL,
  "mail_account_id" TEXT NOT NULL,
  "provider_type" "MailProviderType" NOT NULL,
  "status" "MailProviderConnectionStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
  "credential_id" TEXT,
  "provider_account_id" TEXT,
  "username" TEXT,
  "imap_host" TEXT,
  "imap_port" INTEGER,
  "smtp_host" TEXT,
  "smtp_port" INTEGER,
  "secure_mode" TEXT,
  "granted_scopes" JSONB,
  "sync_cursor" TEXT,
  "last_validated_at" TIMESTAMP(3),
  "last_error_at" TIMESTAMP(3),
  "last_error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "mail_provider_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_attachments" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "file_asset_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT,
  "size_bytes" BIGINT,
  "provider_attachment_id" TEXT,
  "is_inline" BOOLEAN NOT NULL DEFAULT false,
  "download_status" "EmailAttachmentDownloadStatus" NOT NULL DEFAULT 'READY',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mail_provider_connections_mail_account_id_key"
  ON "mail_provider_connections"("mail_account_id");
CREATE INDEX "mail_provider_connections_provider_type_idx"
  ON "mail_provider_connections"("provider_type");
CREATE INDEX "mail_provider_connections_status_idx"
  ON "mail_provider_connections"("status");
CREATE INDEX "mail_provider_connections_credential_id_idx"
  ON "mail_provider_connections"("credential_id");

CREATE INDEX "email_attachments_message_id_idx"
  ON "email_attachments"("message_id");
CREATE INDEX "email_attachments_file_asset_id_idx"
  ON "email_attachments"("file_asset_id");
CREATE INDEX "email_attachments_download_status_idx"
  ON "email_attachments"("download_status");

ALTER TABLE "mail_provider_connections"
  ADD CONSTRAINT "mail_provider_connections_mail_account_id_fkey"
  FOREIGN KEY ("mail_account_id") REFERENCES "mail_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_provider_connections"
  ADD CONSTRAINT "mail_provider_connections_credential_id_fkey"
  FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_attachments"
  ADD CONSTRAINT "email_attachments_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "email_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_attachments"
  ADD CONSTRAINT "email_attachments_file_asset_id_fkey"
  FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

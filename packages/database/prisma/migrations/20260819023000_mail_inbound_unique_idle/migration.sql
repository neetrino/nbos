-- Slice B: inbound idempotency + IDLE heartbeat + sync-log kinds.

ALTER TYPE "MailSyncLogKind" ADD VALUE IF NOT EXISTS 'IDLE_STARTED';
ALTER TYPE "MailSyncLogKind" ADD VALUE IF NOT EXISTS 'IDLE_RECONNECT';

ALTER TABLE "mail_provider_connections" ADD COLUMN "imap_idle_heartbeat_at" TIMESTAMP(3);

-- Keep the oldest row when inbound provider ids collided before the unique.
DELETE FROM "email_messages" AS newer
USING "email_messages" AS older
WHERE newer."provider_message_id" IS NOT NULL
  AND newer."mail_account_id" = older."mail_account_id"
  AND newer."provider_message_id" = older."provider_message_id"
  AND newer."id" > older."id";

CREATE UNIQUE INDEX "email_messages_mail_account_id_provider_message_id_key"
ON "email_messages" ("mail_account_id", "provider_message_id");

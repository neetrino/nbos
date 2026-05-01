CREATE TYPE "MailDeliveryLogKind" AS ENUM (
  'OUTBOUND_DRAFT_SAVED',
  'OUTBOUND_QUEUED',
  'OUTBOUND_SEND_STUB_FAILED',
  'OUTBOUND_SEND_CANCELLED',
  'OUTBOUND_FAILED_RESET_TO_DRAFT'
);

CREATE TABLE "mail_delivery_logs" (
  "id" TEXT NOT NULL,
  "email_message_id" TEXT NOT NULL,
  "mail_account_id" TEXT NOT NULL,
  "actor_employee_id" TEXT NOT NULL,
  "kind" "MailDeliveryLogKind" NOT NULL,
  "detail" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mail_delivery_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mail_delivery_logs_email_message_id_created_at_idx" ON "mail_delivery_logs" ("email_message_id", "created_at");

CREATE INDEX "mail_delivery_logs_mail_account_id_created_at_idx" ON "mail_delivery_logs" ("mail_account_id", "created_at");

ALTER TABLE "mail_delivery_logs"
ADD CONSTRAINT "mail_delivery_logs_email_message_id_fkey" FOREIGN KEY ("email_message_id") REFERENCES "email_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_delivery_logs"
ADD CONSTRAINT "mail_delivery_logs_mail_account_id_fkey" FOREIGN KEY ("mail_account_id") REFERENCES "mail_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_delivery_logs"
ADD CONSTRAINT "mail_delivery_logs_actor_employee_id_fkey" FOREIGN KEY ("actor_employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

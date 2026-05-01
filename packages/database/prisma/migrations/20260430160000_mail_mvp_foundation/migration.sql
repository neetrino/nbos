-- Mail MVP: accounts, threads, messages, recipients (no sync / provider secrets)

CREATE TYPE "MailProviderType" AS ENUM ('GMAIL', 'CORPORATE_IMAP_SMTP');

CREATE TYPE "MailAccountStatus" AS ENUM (
    'ACTIVE',
    'NEEDS_RECONNECT',
    'PAUSED',
    'DISABLED',
    'SYNCING',
    'DEGRADED'
);

CREATE TYPE "EmailThreadStatus" AS ENUM ('OPEN', 'ARCHIVED', 'CLOSED');

CREATE TYPE "EmailMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

CREATE TYPE "EmailMessageReadState" AS ENUM ('UNREAD', 'READ');

CREATE TYPE "EmailRecipientKind" AS ENUM ('FROM', 'TO', 'CC', 'BCC', 'REPLY_TO');

CREATE TABLE "mail_accounts" (
    "id" TEXT NOT NULL,
    "owner_employee_id" TEXT,
    "email_address" TEXT NOT NULL,
    "display_name" TEXT,
    "provider_type" "MailProviderType" NOT NULL,
    "status" "MailAccountStatus" NOT NULL DEFAULT 'PAUSED',
    "last_sync_at" TIMESTAMP(3),
    "last_error_at" TIMESTAMP(3),
    "created_by_employee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mail_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mail_accounts_owner_employee_id_idx" ON "mail_accounts" ("owner_employee_id");

ALTER TABLE "mail_accounts" ADD CONSTRAINT "mail_accounts_owner_employee_id_fkey" FOREIGN KEY ("owner_employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "mail_accounts" ADD CONSTRAINT "mail_accounts_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "email_threads" (
    "id" TEXT NOT NULL,
    "mail_account_id" TEXT NOT NULL,
    "subject_normalized" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL,
    "last_inbound_at" TIMESTAMP(3),
    "last_outbound_at" TIMESTAMP(3),
    "status" "EmailThreadStatus" NOT NULL DEFAULT 'OPEN',
    "has_unread" BOOLEAN NOT NULL DEFAULT true,
    "needs_business_link" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_threads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_threads_mail_account_id_last_message_at_idx" ON "email_threads" ("mail_account_id", "last_message_at");

ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_mail_account_id_fkey" FOREIGN KEY ("mail_account_id") REFERENCES "mail_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "mail_account_id" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "message_id_header" TEXT,
    "direction" "EmailMessageDirection" NOT NULL,
    "subject" TEXT NOT NULL,
    "body_text" TEXT,
    "body_html_sanitized" TEXT,
    "sent_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "read_state" "EmailMessageReadState" NOT NULL DEFAULT 'UNREAD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_messages_thread_id_received_at_idx" ON "email_messages" ("thread_id", "received_at");

ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "email_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_mail_account_id_fkey" FOREIGN KEY ("mail_account_id") REFERENCES "mail_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "email_recipients" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "kind" "EmailRecipientKind" NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_recipients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_recipients_message_id_idx" ON "email_recipients" ("message_id");

ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "email_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

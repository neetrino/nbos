-- Mail MVP live providers: sharing access, thread assignment, provider sync state, sync logs

-- New enums
CREATE TYPE "MailAccountAccessRole" AS ENUM ('ADMIN', 'READER', 'SENDER');

CREATE TYPE "MailSyncLogKind" AS ENUM (
    'SYNC_STARTED',
    'SYNC_COMPLETED',
    'SYNC_FAILED',
    'WATCH_RENEWED',
    'CONNECTION_VALIDATED',
    'CONNECTION_FAILED',
    'RECONNECT_REQUIRED'
);

-- Extend outbound delivery log kinds with real send outcomes
ALTER TYPE "MailDeliveryLogKind" ADD VALUE IF NOT EXISTS 'OUTBOUND_SENT';
ALTER TYPE "MailDeliveryLogKind" ADD VALUE IF NOT EXISTS 'OUTBOUND_SEND_FAILED';

-- Provider connection: per-provider sync cursors and watch/validity state
ALTER TABLE "mail_provider_connections"
    ADD COLUMN "smtp_secure_mode" TEXT,
    ADD COLUMN "gmail_history_id" TEXT,
    ADD COLUMN "gmail_watch_expires_at" TIMESTAMP(3),
    ADD COLUMN "imap_uid_validity" TEXT,
    ADD COLUMN "imap_last_uid" TEXT;

-- Email thread: provider thread id + manual assignment
ALTER TABLE "email_threads"
    ADD COLUMN "provider_thread_id" TEXT,
    ADD COLUMN "assigned_to_employee_id" TEXT,
    ADD COLUMN "assigned_by_employee_id" TEXT,
    ADD COLUMN "assigned_at" TIMESTAMP(3);

CREATE INDEX "email_threads_assigned_to_employee_id_idx" ON "email_threads" ("assigned_to_employee_id");

ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_assigned_to_employee_id_fkey" FOREIGN KEY ("assigned_to_employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_assigned_by_employee_id_fkey" FOREIGN KEY ("assigned_by_employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mailbox sharing grants
CREATE TABLE "mail_account_accesses" (
    "id" TEXT NOT NULL,
    "mail_account_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role" "MailAccountAccessRole" NOT NULL,
    "granted_by_employee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mail_account_accesses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mail_account_accesses_mail_account_id_employee_id_key" ON "mail_account_accesses" ("mail_account_id", "employee_id");

CREATE INDEX "mail_account_accesses_employee_id_idx" ON "mail_account_accesses" ("employee_id");

ALTER TABLE "mail_account_accesses" ADD CONSTRAINT "mail_account_accesses_mail_account_id_fkey" FOREIGN KEY ("mail_account_id") REFERENCES "mail_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_account_accesses" ADD CONSTRAINT "mail_account_accesses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_account_accesses" ADD CONSTRAINT "mail_account_accesses_granted_by_employee_id_fkey" FOREIGN KEY ("granted_by_employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Encrypted provider secret store (never plaintext)
CREATE TABLE "mail_provider_secrets" (
    "id" TEXT NOT NULL,
    "mail_account_id" TEXT NOT NULL,
    "encrypted_secret" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mail_provider_secrets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mail_provider_secrets_mail_account_id_key" ON "mail_provider_secrets" ("mail_account_id");

ALTER TABLE "mail_provider_secrets" ADD CONSTRAINT "mail_provider_secrets_mail_account_id_fkey" FOREIGN KEY ("mail_account_id") REFERENCES "mail_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Account-level sync/connection event log
CREATE TABLE "mail_sync_logs" (
    "id" TEXT NOT NULL,
    "mail_account_id" TEXT NOT NULL,
    "kind" "MailSyncLogKind" NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mail_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mail_sync_logs_mail_account_id_created_at_idx" ON "mail_sync_logs" ("mail_account_id", "created_at");

ALTER TABLE "mail_sync_logs" ADD CONSTRAINT "mail_sync_logs_mail_account_id_fkey" FOREIGN KEY ("mail_account_id") REFERENCES "mail_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

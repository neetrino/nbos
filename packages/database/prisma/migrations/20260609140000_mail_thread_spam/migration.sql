ALTER TABLE "email_threads"
ADD COLUMN "is_spam" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "email_threads_mail_account_id_is_spam_idx" ON "email_threads" ("mail_account_id", "is_spam");

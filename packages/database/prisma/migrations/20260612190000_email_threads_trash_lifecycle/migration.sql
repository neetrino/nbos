-- Mail Phase 7.1: trash-first lifecycle (recoverable deletion before retention purge).

ALTER TABLE "email_threads" ADD COLUMN "trashed_at" TIMESTAMP(3);
ALTER TABLE "email_threads" ADD COLUMN "trashed_by_employee_id" TEXT;

CREATE INDEX "email_threads_mail_account_id_trashed_at_idx"
  ON "email_threads"("mail_account_id", "trashed_at");

ALTER TABLE "email_threads"
  ADD CONSTRAINT "email_threads_trashed_by_employee_id_fkey"
  FOREIGN KEY ("trashed_by_employee_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

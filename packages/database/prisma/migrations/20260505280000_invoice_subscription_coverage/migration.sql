-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "coverage_start_month" VARCHAR(7),
ADD COLUMN "coverage_month_count" INTEGER;

-- Backfill: one calendar month per existing subscription invoice (month of invoice creation, UTC).
UPDATE "invoices"
SET
  "coverage_start_month" = to_char(date_trunc('month', "created_at"), 'YYYY-MM'),
  "coverage_month_count" = 1
WHERE
  "subscription_id" IS NOT NULL;

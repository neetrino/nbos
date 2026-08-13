-- Split Subscription money model: `amount` is the per-period contract sum (source of truth);
-- `monthly_equivalent_amount` is analytics-only (GENERATED ALWAYS STORED).
-- Ordering: backfill amount/coverage BEFORE adding the generated column so it never
-- computes from pre-migration monthly shares. Relies on prepaid_month_count from
-- 20260813170000. Caveat: Prisma may report migrate-dev drift on the generated column
-- because the DDL is hand-authored (GENERATED ALWAYS) while the schema uses
-- @default(dbgenerated()) so the client omits the field from writes.

-- 1. Rename monthly share column to period amount (values still monthly until step 4).
ALTER TABLE "subscriptions" RENAME COLUMN "base_monthly_amount" TO "amount";

-- 2. Required coverage length; temporary DEFAULT so existing rows validate.
ALTER TABLE "subscriptions"
  ADD COLUMN "coverage_month_count" INTEGER NOT NULL DEFAULT 1;

-- 3. Backfill coverage from billing frequency / prepaid months.
UPDATE "subscriptions"
SET "coverage_month_count" = CASE
  WHEN "billing_frequency" = 'YEARLY' THEN 12
  WHEN "billing_frequency" = 'CUSTOM' THEN COALESCE("prepaid_month_count", 1)
  ELSE 1
END;

-- 4. Convert stored monthly share into real per-period contract sum.
UPDATE "subscriptions"
SET "amount" = "amount" * "coverage_month_count";

-- 5. Drop temporary default — every create must state the period explicitly.
ALTER TABLE "subscriptions"
  ALTER COLUMN "coverage_month_count" DROP DEFAULT;

-- 6. Drop superseded prepaid column.
ALTER TABLE "subscriptions"
  DROP COLUMN "prepaid_month_count";

-- 7. Guard generated-column division by zero.
ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_coverage_month_count_check"
  CHECK ("coverage_month_count" >= 1);

-- 8. Analytics monthly equivalent (round to 2 decimals; amount stays authoritative).
ALTER TABLE "subscriptions"
  ADD COLUMN "monthly_equivalent_amount" NUMERIC(12, 2)
  GENERATED ALWAYS AS (round(("amount" / "coverage_month_count")::numeric, 2)) STORED;

-- Additive: Expense Plan can be cancelled without deleting history.
-- Existing rows stay ACTIVE. Rolling deploy: old writers omit the columns (DB default applies).

CREATE TYPE "ExpensePlanStatusEnum" AS ENUM ('ACTIVE', 'CANCELLED');

ALTER TABLE "expense_plans"
  ADD COLUMN "status" "ExpensePlanStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "cancelled_at" TIMESTAMP(3);

CREATE INDEX "expense_plans_status_idx" ON "expense_plans"("status");

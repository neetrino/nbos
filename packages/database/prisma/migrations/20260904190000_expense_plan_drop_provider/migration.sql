-- Expense Plan free-text provider removed: future link (if any) will use
-- credential_providers / Credentials, scoped by category (e.g. Domain/Hosting).
ALTER TABLE "expense_plans" DROP COLUMN IF EXISTS "provider";

-- Consolidate expense categories to 6 selectable buckets (+ payroll system enums unchanged).
-- Survivors: DOMAIN, TOOLS, MARKETING, OFFICE, TAXES, OTHER
-- Remap: HOSTING→DOMAIN; SERVICE|INTERNAL_INFRA→TOOLS; BANK_FEES→TAXES; TRAINING→OTHER

UPDATE "expense_plans"
SET "category" = 'DOMAIN'::"ExpenseCategoryEnum"
WHERE "category" = 'HOSTING'::"ExpenseCategoryEnum";

UPDATE "expenses"
SET "category" = 'DOMAIN'::"ExpenseCategoryEnum"
WHERE "category" = 'HOSTING'::"ExpenseCategoryEnum";

UPDATE "expense_plans"
SET "category" = 'TOOLS'::"ExpenseCategoryEnum"
WHERE "category" IN (
  'SERVICE'::"ExpenseCategoryEnum",
  'INTERNAL_INFRA'::"ExpenseCategoryEnum"
);

UPDATE "expenses"
SET "category" = 'TOOLS'::"ExpenseCategoryEnum"
WHERE "category" IN (
  'SERVICE'::"ExpenseCategoryEnum",
  'INTERNAL_INFRA'::"ExpenseCategoryEnum"
);

UPDATE "expense_plans"
SET "category" = 'TAXES'::"ExpenseCategoryEnum"
WHERE "category" = 'BANK_FEES'::"ExpenseCategoryEnum";

UPDATE "expenses"
SET "category" = 'TAXES'::"ExpenseCategoryEnum"
WHERE "category" = 'BANK_FEES'::"ExpenseCategoryEnum";

UPDATE "expense_plans"
SET "category" = 'OTHER'::"ExpenseCategoryEnum"
WHERE "category" = 'TRAINING'::"ExpenseCategoryEnum";

UPDATE "expenses"
SET "category" = 'OTHER'::"ExpenseCategoryEnum"
WHERE "category" = 'TRAINING'::"ExpenseCategoryEnum";

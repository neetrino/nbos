-- Additive: ExpensePlan / Expense product owner + optional Vault credential.
-- project_id stays; rewritten from Product when product_id is set.

ALTER TABLE "expense_plans" ADD COLUMN "product_id" TEXT;
ALTER TABLE "expense_plans" ADD COLUMN "credential_id" TEXT;
ALTER TABLE "expenses" ADD COLUMN "product_id" TEXT;
ALTER TABLE "expenses" ADD COLUMN "credential_id" TEXT;

UPDATE "expense_plans" AS ep
SET "product_id" = csr."product_id"
FROM "client_service_records" AS csr
WHERE ep."client_service_record_id" = csr."id"
  AND ep."product_id" IS NULL
  AND csr."product_id" IS NOT NULL;

UPDATE "expenses" AS e
SET "product_id" = csr."product_id"
FROM "client_service_records" AS csr
WHERE e."client_service_record_id" = csr."id"
  AND e."product_id" IS NULL
  AND csr."product_id" IS NOT NULL;

UPDATE "expenses" AS e
SET "product_id" = ep."product_id"
FROM "expense_plans" AS ep
WHERE e."expense_plan_id" = ep."id"
  AND e."product_id" IS NULL
  AND ep."product_id" IS NOT NULL;

UPDATE "expense_plans" AS ep
SET "product_id" = p."id"
FROM "products" AS p
WHERE ep."product_id" IS NULL
  AND ep."project_id" IS NOT NULL
  AND p."project_id" = ep."project_id"
  AND (
    SELECT COUNT(*)::int FROM "products" AS p2 WHERE p2."project_id" = ep."project_id"
  ) = 1;

UPDATE "expenses" AS e
SET "product_id" = p."id"
FROM "products" AS p
WHERE e."product_id" IS NULL
  AND e."project_id" IS NOT NULL
  AND p."project_id" = e."project_id"
  AND (
    SELECT COUNT(*)::int FROM "products" AS p2 WHERE p2."project_id" = e."project_id"
  ) = 1;

UPDATE "expense_plans" AS ep
SET "project_id" = p."project_id"
FROM "products" AS p
WHERE ep."product_id" = p."id";

UPDATE "expenses" AS e
SET "project_id" = p."project_id"
FROM "products" AS p
WHERE e."product_id" = p."id";

UPDATE "expense_plans" AS ep
SET "credential_id" = csr."provider_account_id"
FROM "client_service_records" AS csr
WHERE ep."client_service_record_id" = csr."id"
  AND ep."credential_id" IS NULL
  AND csr."provider_account_id" IS NOT NULL;

UPDATE "expenses" AS e
SET "credential_id" = csr."provider_account_id"
FROM "client_service_records" AS csr
WHERE e."client_service_record_id" = csr."id"
  AND e."credential_id" IS NULL
  AND csr."provider_account_id" IS NOT NULL;

UPDATE "expenses" AS e
SET "credential_id" = ep."credential_id"
FROM "expense_plans" AS ep
WHERE e."expense_plan_id" = ep."id"
  AND e."credential_id" IS NULL
  AND ep."credential_id" IS NOT NULL;

ALTER TABLE "expense_plans"
  ADD CONSTRAINT "expense_plans_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expense_plans"
  ADD CONSTRAINT "expense_plans_credential_id_fkey"
  FOREIGN KEY ("credential_id") REFERENCES "credentials"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_credential_id_fkey"
  FOREIGN KEY ("credential_id") REFERENCES "credentials"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "expense_plans_product_id_idx" ON "expense_plans"("product_id");
CREATE INDEX "expense_plans_credential_id_idx" ON "expense_plans"("credential_id");
CREATE INDEX "expenses_product_id_idx" ON "expenses"("product_id");
CREATE INDEX "expenses_credential_id_idx" ON "expenses"("credential_id");

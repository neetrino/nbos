-- Product billing company: Product.companyId owner, Project.companyId stays as brand seed.
-- Backfill from Project.companyId where set. Column stays nullable.

ALTER TABLE "products" ADD COLUMN "company_id" TEXT;

UPDATE "products" AS p
SET "company_id" = pr."company_id"
FROM "projects" pr
WHERE p."project_id" = pr."id"
  AND pr."company_id" IS NOT NULL;

ALTER TABLE "products"
  ADD CONSTRAINT "products_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "products_company_id_idx" ON "products"("company_id");

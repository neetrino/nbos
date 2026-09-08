-- Additive: Invoice.productId owner (nullable for orphans). projectId stays.

ALTER TABLE "invoices" ADD COLUMN "product_id" TEXT;

UPDATE "invoices" AS i
SET "product_id" = COALESCE(
  (SELECT o."product_id" FROM "orders" o WHERE o."id" = i."order_id"),
  (
    SELECT e."product_id"
    FROM "orders" o
    JOIN "extensions" e ON e."id" = o."extension_id"
    WHERE o."id" = i."order_id"
  ),
  (SELECT s."product_id" FROM "subscriptions" s WHERE s."id" = i."subscription_id"),
  (
    SELECT c."product_id"
    FROM "client_service_records" c
    WHERE c."id" = i."client_service_record_id"
  ),
  (SELECT t."product_id" FROM "partner_service_terms" t WHERE t."invoice_id" = i."id")
)
WHERE i."product_id" IS NULL;

UPDATE "invoices" AS i
SET "project_id" = p."project_id"
FROM "products" AS p
WHERE i."product_id" = p."id"
  AND i."product_id" IS NOT NULL;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "invoices_product_id_idx" ON "invoices"("product_id");

-- Platform does not apply to Marketing or Other: store NULL, not WEB.
-- Code / WordPress / Shopify keep the WEB default for inserts that omit the column.

ALTER TABLE "products" ALTER COLUMN "product_platform" DROP NOT NULL;

UPDATE "products"
SET "product_platform" = NULL
WHERE "product_category" IN ('MARKETING', 'OTHER');

UPDATE "deals"
SET "product_platform" = NULL
WHERE "product_category" IS NULL
   OR "product_category" IN ('MARKETING', 'OTHER');

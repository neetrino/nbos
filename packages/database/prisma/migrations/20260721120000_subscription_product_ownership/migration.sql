-- Subscription ownership: Project → Product → Subscription
-- Deal OUTSOURCE delivery toggle; PartnerServiceTerm.productId

-- 1) Deal.outsourceGoesToDelivery
ALTER TABLE "deals"
  ADD COLUMN "outsource_goes_to_delivery" BOOLEAN NOT NULL DEFAULT false;

-- 2) PartnerServiceTerm.productId (nullable; required at MONTHLY finance create)
ALTER TABLE "partner_service_terms"
  ADD COLUMN "product_id" TEXT;

-- 3) Subscription.productId — add nullable, backfill, then NOT NULL
ALTER TABLE "subscriptions"
  ADD COLUMN "product_id" TEXT;

-- Backfill: first product on the same project (by created_at)
UPDATE "subscriptions" AS s
SET "product_id" = p.id
FROM (
  SELECT DISTINCT ON ("project_id")
    "id",
    "project_id"
  FROM "products"
  ORDER BY "project_id", "created_at" ASC
) AS p
WHERE s."project_id" = p."project_id"
  AND s."product_id" IS NULL;

-- Orphans: create a shell Product per project that has subscriptions but no products
INSERT INTO "products" (
  "id",
  "project_id",
  "name",
  "product_category",
  "product_type",
  "status",
  "delivery_stage",
  "delivery_work_status",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  s."project_id",
  'Backfill product for subscription ' || MIN(s."code"),
  'CODE',
  'COMPANY_WEBSITE',
  'DONE',
  NULL,
  'ACTIVE',
  NOW(),
  NOW()
FROM "subscriptions" s
WHERE s."product_id" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "products" p WHERE p."project_id" = s."project_id"
  )
GROUP BY s."project_id";

UPDATE "subscriptions" AS s
SET "product_id" = p.id
FROM (
  SELECT DISTINCT ON ("project_id")
    "id",
    "project_id"
  FROM "products"
  ORDER BY "project_id", "created_at" ASC
) AS p
WHERE s."project_id" = p."project_id"
  AND s."product_id" IS NULL;

-- Fail loudly if any row still missing product_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "subscriptions" WHERE "product_id" IS NULL) THEN
    RAISE EXCEPTION 'subscription_product_ownership: cannot backfill product_id for all subscriptions';
  END IF;
END $$;

ALTER TABLE "subscriptions"
  ALTER COLUMN "product_id" SET NOT NULL;

CREATE INDEX "subscriptions_product_id_idx" ON "subscriptions"("product_id");
CREATE INDEX "subscriptions_project_id_idx" ON "subscriptions"("project_id");
CREATE INDEX "partner_service_terms_product_id_idx" ON "partner_service_terms"("product_id");

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "partner_service_terms"
  ADD CONSTRAINT "partner_service_terms_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill PartnerServiceTerm.productId from linked subscription when present
UPDATE "partner_service_terms" AS t
SET "product_id" = s."product_id"
FROM "subscriptions" s
WHERE t."subscription_id" = s."id"
  AND t."product_id" IS NULL;

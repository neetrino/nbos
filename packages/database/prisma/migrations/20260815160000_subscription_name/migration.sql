-- Subscription.commercial name (UI titles; distinct from system code)
-- Required scalar: add nullable → backfill → guard → SET NOT NULL (no permanent DEFAULT)

ALTER TABLE "subscriptions"
  ADD COLUMN "name" TEXT;

-- Backfill priority (first non-empty wins):
-- 1) deals.name via subscriptions.product_id → orders.product_id → orders.deal_id
-- 2) products.name via subscriptions.product_id
-- 3) subscriptions.code
UPDATE "subscriptions" AS s
SET "name" = COALESCE(
  NULLIF(TRIM(src.deal_name), ''),
  NULLIF(TRIM(src.product_name), ''),
  NULLIF(TRIM(s.code), '')
)
FROM (
  SELECT
    s2."id" AS subscription_id,
    d."name" AS deal_name,
    p."name" AS product_name
  FROM "subscriptions" s2
  INNER JOIN "products" p ON p."id" = s2."product_id"
  LEFT JOIN "orders" o ON o."product_id" = s2."product_id"
  LEFT JOIN "deals" d ON d."id" = o."deal_id"
) AS src
WHERE s."id" = src.subscription_id
  AND s."name" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "subscriptions"
    WHERE "name" IS NULL OR NULLIF(TRIM("name"), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'subscription_name: cannot backfill name for all subscriptions';
  END IF;
END $$;

ALTER TABLE "subscriptions"
  ALTER COLUMN "name" SET NOT NULL;

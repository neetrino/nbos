-- One published unit vector per card, or per gradation when the card has tiers.
-- The original unique index was one published row per function, which blocked
-- CNT_MULTILINGUAL and any other multi-tier card.

DROP INDEX IF EXISTS "delivery_function_price_versions_one_published";

CREATE UNIQUE INDEX "delivery_function_price_versions_one_published_card"
  ON "delivery_function_price_versions"("function_id")
  WHERE "status" = 'PUBLISHED' AND "tier_id" IS NULL;

CREATE UNIQUE INDEX "delivery_function_price_versions_one_published_tier"
  ON "delivery_function_price_versions"("function_id", "tier_id")
  WHERE "status" = 'PUBLISHED' AND "tier_id" IS NOT NULL;

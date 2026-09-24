-- Replace the sale multiplier / fixed-amount pair with one AMD-per-unit rate.
-- One development unit costs 1 000 AMD; a leftover multiplier of 10 becomes 10 000 AMD per unit.
-- Rows that only had a lump-sum fixed amount keep a NULL rate for the Owner to re-enter.

ALTER TABLE "delivery_sale_price_versions"
  ADD COLUMN "amount_per_unit" DECIMAL(14,4);

UPDATE "delivery_sale_price_versions"
SET "amount_per_unit" = "multiplier" * 1000
WHERE "multiplier" IS NOT NULL;

ALTER TABLE "delivery_compensation_runtime_settings"
  ADD COLUMN "default_sale_amount_per_unit" DECIMAL(14,4) NOT NULL DEFAULT 10000;

UPDATE "delivery_compensation_runtime_settings"
SET "default_sale_amount_per_unit" = "default_sale_multiplier" * 1000
WHERE "default_sale_multiplier" IS NOT NULL;

ALTER TABLE "delivery_sale_price_versions"
  DROP COLUMN "multiplier",
  DROP COLUMN "fixed_amount";

ALTER TABLE "delivery_compensation_runtime_settings"
  DROP COLUMN "default_sale_multiplier";

-- A leftover lump-sum row has no recoverable per-unit rate. Give it the global default so the
-- column can be required; the Owner re-enters the real rate on the norms screen.
UPDATE "delivery_sale_price_versions"
SET "amount_per_unit" = 10000
WHERE "amount_per_unit" IS NULL;

ALTER TABLE "delivery_sale_price_versions"
  ALTER COLUMN "amount_per_unit" SET NOT NULL;

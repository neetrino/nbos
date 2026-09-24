-- Instance volume on a deal or delivery line. 1.0 is the catalog standard.
-- Existing rows stay at 1.0. Do not apply this migration to production from here.

ALTER TABLE "delivery_deal_quotes"
  ADD COLUMN "core_volume_factor" DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  ADD COLUMN "core_volume_reason" TEXT;

ALTER TABLE "delivery_deal_quote_items"
  ADD COLUMN "volume_factor" DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  ADD COLUMN "volume_reason" TEXT;

ALTER TABLE "delivery_configurations"
  ADD COLUMN "core_volume_factor" DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  ADD COLUMN "core_volume_reason" TEXT;

ALTER TABLE "delivery_configuration_features"
  ADD COLUMN "volume_factor" DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  ADD COLUMN "volume_reason" TEXT;

ALTER TABLE "delivery_deal_quotes"
  ADD CONSTRAINT "delivery_deal_quotes_core_volume_check"
  CHECK (
    "core_volume_factor" >= 0.5
    AND "core_volume_factor" <= 2.0
    AND "core_volume_factor" * 10 = trunc("core_volume_factor" * 10)
    AND (
      "core_volume_factor" = 1.0
      OR (
        "core_volume_reason" IS NOT NULL
        AND length(btrim("core_volume_reason")) >= 10
      )
    )
  );

ALTER TABLE "delivery_deal_quote_items"
  ADD CONSTRAINT "delivery_deal_quote_items_volume_check"
  CHECK (
    "volume_factor" >= 0.5
    AND "volume_factor" <= 2.0
    AND "volume_factor" * 10 = trunc("volume_factor" * 10)
    AND (
      "volume_factor" = 1.0
      OR ("volume_reason" IS NOT NULL AND length(btrim("volume_reason")) >= 10)
    )
  );

ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_core_volume_check"
  CHECK (
    "core_volume_factor" >= 0.5
    AND "core_volume_factor" <= 2.0
    AND "core_volume_factor" * 10 = trunc("core_volume_factor" * 10)
    AND (
      "core_volume_factor" = 1.0
      OR (
        "core_volume_reason" IS NOT NULL
        AND length(btrim("core_volume_reason")) >= 10
      )
    )
  );

ALTER TABLE "delivery_configuration_features"
  ADD CONSTRAINT "delivery_configuration_features_volume_check"
  CHECK (
    "volume_factor" >= 0.5
    AND "volume_factor" <= 2.0
    AND "volume_factor" * 10 = trunc("volume_factor" * 10)
    AND (
      "volume_factor" = 1.0
      OR ("volume_reason" IS NOT NULL AND length(btrim("volume_reason")) >= 10)
    )
  );

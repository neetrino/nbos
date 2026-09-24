-- Lower the instance volume floor from 0.5 to 0. Existing rows stay valid.
-- Do not apply this migration to production from here.

ALTER TABLE "delivery_deal_quotes" DROP CONSTRAINT "delivery_deal_quotes_core_volume_check";
ALTER TABLE "delivery_deal_quotes"
  ADD CONSTRAINT "delivery_deal_quotes_core_volume_check"
  CHECK (
    "core_volume_factor" >= 0
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

ALTER TABLE "delivery_deal_quote_items" DROP CONSTRAINT "delivery_deal_quote_items_volume_check";
ALTER TABLE "delivery_deal_quote_items"
  ADD CONSTRAINT "delivery_deal_quote_items_volume_check"
  CHECK (
    "volume_factor" >= 0
    AND "volume_factor" <= 2.0
    AND "volume_factor" * 10 = trunc("volume_factor" * 10)
    AND (
      "volume_factor" = 1.0
      OR ("volume_reason" IS NOT NULL AND length(btrim("volume_reason")) >= 10)
    )
  );

ALTER TABLE "delivery_configurations" DROP CONSTRAINT "delivery_configurations_core_volume_check";
ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_core_volume_check"
  CHECK (
    "core_volume_factor" >= 0
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

ALTER TABLE "delivery_configuration_features" DROP CONSTRAINT "delivery_configuration_features_volume_check";
ALTER TABLE "delivery_configuration_features"
  ADD CONSTRAINT "delivery_configuration_features_volume_check"
  CHECK (
    "volume_factor" >= 0
    AND "volume_factor" <= 2.0
    AND "volume_factor" * 10 = trunc("volume_factor" * 10)
    AND (
      "volume_factor" = 1.0
      OR ("volume_reason" IS NOT NULL AND length(btrim("volume_reason")) >= 10)
    )
  );

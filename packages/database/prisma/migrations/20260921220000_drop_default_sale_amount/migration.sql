-- Every catalog card stores its own sale rate. There is no implicit 10 000 fallback.

ALTER TABLE "delivery_compensation_runtime_settings"
  DROP COLUMN "default_sale_amount_per_unit";

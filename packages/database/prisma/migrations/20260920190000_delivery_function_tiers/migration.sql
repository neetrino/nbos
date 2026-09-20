-- Delivery Compensation v2: gradations inside a function card.
-- Additive only. Existing price versions keep tier_id NULL, which means "function without gradations",
-- so nothing about current pricing changes.

CREATE TABLE IF NOT EXISTS "delivery_function_tiers" (
    "id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_function_tiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_function_tiers_function_id_code_key"
    ON "delivery_function_tiers" ("function_id", "code");

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_function_tiers_function_id_position_key"
    ON "delivery_function_tiers" ("function_id", "position");

CREATE INDEX IF NOT EXISTS "delivery_function_tiers_function_id_idx"
    ON "delivery_function_tiers" ("function_id");

CREATE TABLE IF NOT EXISTS "delivery_function_tier_product_types" (
    "id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "product_type" "ProductTypeEnum" NOT NULL,

    CONSTRAINT "delivery_function_tier_product_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_function_tier_product_types_tier_id_product_type_key"
    ON "delivery_function_tier_product_types" ("tier_id", "product_type");

CREATE INDEX IF NOT EXISTS "delivery_function_tier_product_types_product_type_idx"
    ON "delivery_function_tier_product_types" ("product_type");

ALTER TABLE "delivery_function_price_versions"
    ADD COLUMN IF NOT EXISTS "tier_id" TEXT;

CREATE INDEX IF NOT EXISTS "delivery_function_price_versions_tier_id_status_idx"
    ON "delivery_function_price_versions" ("tier_id", "status");

ALTER TABLE "delivery_configuration_features"
    ADD COLUMN IF NOT EXISTS "tier_id" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_function_tiers_function_id_fkey') THEN
        ALTER TABLE "delivery_function_tiers"
            ADD CONSTRAINT "delivery_function_tiers_function_id_fkey"
            FOREIGN KEY ("function_id") REFERENCES "delivery_functions" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_function_tier_product_types_tier_id_fkey') THEN
        ALTER TABLE "delivery_function_tier_product_types"
            ADD CONSTRAINT "delivery_function_tier_product_types_tier_id_fkey"
            FOREIGN KEY ("tier_id") REFERENCES "delivery_function_tiers" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_function_price_versions_tier_id_fkey') THEN
        ALTER TABLE "delivery_function_price_versions"
            ADD CONSTRAINT "delivery_function_price_versions_tier_id_fkey"
            FOREIGN KEY ("tier_id") REFERENCES "delivery_function_tiers" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Restrict: a gradation that is already recorded in a plan must not disappear under it.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_configuration_features_tier_id_fkey') THEN
        ALTER TABLE "delivery_configuration_features"
            ADD CONSTRAINT "delivery_configuration_features_tier_id_fkey"
            FOREIGN KEY ("tier_id") REFERENCES "delivery_function_tiers" ("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

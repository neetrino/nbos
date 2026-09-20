-- Delivery Compensation v2: sale prices for catalog items. Additive only.
-- Sale price is what a client pays; it never touches the units a team is paid from.

CREATE TABLE IF NOT EXISTS "delivery_sale_price_versions" (
    "id" TEXT NOT NULL,
    "target_key" TEXT NOT NULL,
    "function_id" TEXT,
    "tier_id" TEXT,
    "base_profile_version_id" TEXT,
    "version" INTEGER NOT NULL,
    "status" "DeliveryNormativeStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "multiplier" DECIMAL(8,4),
    "fixed_amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "published_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_sale_price_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_sale_price_versions_target_key_version_key"
    ON "delivery_sale_price_versions" ("target_key", "version");

CREATE INDEX IF NOT EXISTS "delivery_sale_price_versions_target_key_status_idx"
    ON "delivery_sale_price_versions" ("target_key", "status");

ALTER TABLE "delivery_compensation_runtime_settings"
    ADD COLUMN IF NOT EXISTS "default_sale_multiplier" DECIMAL(8,4) NOT NULL DEFAULT 10;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_sale_price_versions_function_id_fkey') THEN
        ALTER TABLE "delivery_sale_price_versions"
            ADD CONSTRAINT "delivery_sale_price_versions_function_id_fkey"
            FOREIGN KEY ("function_id") REFERENCES "delivery_functions" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_sale_price_versions_tier_id_fkey') THEN
        ALTER TABLE "delivery_sale_price_versions"
            ADD CONSTRAINT "delivery_sale_price_versions_tier_id_fkey"
            FOREIGN KEY ("tier_id") REFERENCES "delivery_function_tiers" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_sale_price_versions_base_profile_version_id_fkey') THEN
        ALTER TABLE "delivery_sale_price_versions"
            ADD CONSTRAINT "delivery_sale_price_versions_base_profile_version_id_fkey"
            FOREIGN KEY ("base_profile_version_id") REFERENCES "delivery_base_profile_versions" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delivery_sale_price_versions_published_by_id_fkey') THEN
        ALTER TABLE "delivery_sale_price_versions"
            ADD CONSTRAINT "delivery_sale_price_versions_published_by_id_fkey"
            FOREIGN KEY ("published_by_id") REFERENCES "employees" ("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

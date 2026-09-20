-- Delivery Compensation v2: structured core composition and size presets.
-- Additive only. No data is written, nothing existing is altered, no money is affected.

-- Explicit list of what the indivisible product core contains. Content only, no units.
CREATE TABLE IF NOT EXISTS "delivery_base_profile_core_items" (
    "id" TEXT NOT NULL,
    "profile_version_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_base_profile_core_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_base_profile_core_items_profile_version_id_position_key"
    ON "delivery_base_profile_core_items" ("profile_version_id", "position");

CREATE INDEX IF NOT EXISTS "delivery_base_profile_core_items_profile_version_id_idx"
    ON "delivery_base_profile_core_items" ("profile_version_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'delivery_base_profile_core_items_profile_version_id_fkey'
    ) THEN
        ALTER TABLE "delivery_base_profile_core_items"
            ADD CONSTRAINT "delivery_base_profile_core_items_profile_version_id_fkey"
            FOREIGN KEY ("profile_version_id")
            REFERENCES "delivery_base_profile_versions" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Modules pre-checked for a size level. Charged as normal extras; not included-in-base.
CREATE TABLE IF NOT EXISTS "delivery_config_size_presets" (
    "id" TEXT NOT NULL,
    "profile_key" TEXT NOT NULL,
    "config_size" "DeliveryConfigSizeEnum" NOT NULL,
    "function_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_config_size_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_config_size_presets_profile_key_config_size_function_id_key"
    ON "delivery_config_size_presets" ("profile_key", "config_size", "function_id");

CREATE INDEX IF NOT EXISTS "delivery_config_size_presets_profile_key_config_size_idx"
    ON "delivery_config_size_presets" ("profile_key", "config_size");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'delivery_config_size_presets_function_id_fkey'
    ) THEN
        ALTER TABLE "delivery_config_size_presets"
            ADD CONSTRAINT "delivery_config_size_presets_function_id_fkey"
            FOREIGN KEY ("function_id")
            REFERENCES "delivery_functions" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

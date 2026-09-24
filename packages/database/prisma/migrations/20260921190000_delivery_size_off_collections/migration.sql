-- Decision 1.18: configSize is not a product and not a core price.
-- Drop size presets and the size column. Add named collections and a deal quote.

DROP TABLE IF EXISTS "delivery_config_size_presets";

ALTER TABLE "delivery_base_profile_versions" DROP COLUMN IF EXISTS "config_size";
ALTER TABLE "delivery_configurations" DROP COLUMN IF EXISTS "config_size";

DROP TYPE IF EXISTS "DeliveryConfigSizeEnum";

CREATE TABLE IF NOT EXISTS "delivery_function_collections" (
    "id" TEXT NOT NULL,
    "product_type" "ProductTypeEnum" NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_function_collections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_function_collections_product_type_name_key"
    ON "delivery_function_collections" ("product_type", "name");

CREATE INDEX IF NOT EXISTS "delivery_function_collections_product_type_position_idx"
    ON "delivery_function_collections" ("product_type", "position");

CREATE TABLE IF NOT EXISTS "delivery_function_collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "delivery_function_collection_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_function_collection_items_collection_id_function_id_key"
    ON "delivery_function_collection_items" ("collection_id", "function_id");

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_function_collection_items_collection_id_position_key"
    ON "delivery_function_collection_items" ("collection_id", "position");

CREATE INDEX IF NOT EXISTS "delivery_function_collection_items_function_id_idx"
    ON "delivery_function_collection_items" ("function_id");

CREATE TABLE IF NOT EXISTS "delivery_deal_quotes" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "applied_collection_id" TEXT,
    "implementation_base" "DeliveryImplementationBaseEnum" NOT NULL DEFAULT 'FROM_SCRATCH',
    "design_mode" "DeliveryDesignModeEnum" NOT NULL DEFAULT 'AI_DESIGN',
    "ai_designer_review" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_deal_quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_deal_quotes_deal_id_key"
    ON "delivery_deal_quotes" ("deal_id");

CREATE TABLE IF NOT EXISTS "delivery_deal_quote_items" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,
    "tier_id" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "delivery_deal_quote_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_deal_quote_items_quote_id_function_id_key"
    ON "delivery_deal_quote_items" ("quote_id", "function_id");

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_deal_quote_items_quote_id_position_key"
    ON "delivery_deal_quote_items" ("quote_id", "position");

CREATE INDEX IF NOT EXISTS "delivery_deal_quote_items_function_id_idx"
    ON "delivery_deal_quote_items" ("function_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'delivery_function_collection_items_collection_id_fkey'
    ) THEN
        ALTER TABLE "delivery_function_collection_items"
            ADD CONSTRAINT "delivery_function_collection_items_collection_id_fkey"
            FOREIGN KEY ("collection_id")
            REFERENCES "delivery_function_collections" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'delivery_function_collection_items_function_id_fkey'
    ) THEN
        ALTER TABLE "delivery_function_collection_items"
            ADD CONSTRAINT "delivery_function_collection_items_function_id_fkey"
            FOREIGN KEY ("function_id")
            REFERENCES "delivery_functions" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'delivery_deal_quotes_deal_id_fkey'
    ) THEN
        ALTER TABLE "delivery_deal_quotes"
            ADD CONSTRAINT "delivery_deal_quotes_deal_id_fkey"
            FOREIGN KEY ("deal_id")
            REFERENCES "deals" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'delivery_deal_quotes_applied_collection_id_fkey'
    ) THEN
        ALTER TABLE "delivery_deal_quotes"
            ADD CONSTRAINT "delivery_deal_quotes_applied_collection_id_fkey"
            FOREIGN KEY ("applied_collection_id")
            REFERENCES "delivery_function_collections" ("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'delivery_deal_quote_items_quote_id_fkey'
    ) THEN
        ALTER TABLE "delivery_deal_quote_items"
            ADD CONSTRAINT "delivery_deal_quote_items_quote_id_fkey"
            FOREIGN KEY ("quote_id")
            REFERENCES "delivery_deal_quotes" ("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'delivery_deal_quote_items_function_id_fkey'
    ) THEN
        ALTER TABLE "delivery_deal_quote_items"
            ADD CONSTRAINT "delivery_deal_quote_items_function_id_fkey"
            FOREIGN KEY ("function_id")
            REFERENCES "delivery_functions" ("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'delivery_deal_quote_items_tier_id_fkey'
    ) THEN
        ALTER TABLE "delivery_deal_quote_items"
            ADD CONSTRAINT "delivery_deal_quote_items_tier_id_fkey"
            FOREIGN KEY ("tier_id")
            REFERENCES "delivery_function_tiers" ("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

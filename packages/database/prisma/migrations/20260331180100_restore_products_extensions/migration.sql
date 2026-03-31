-- Part 2: Create tables, migrate data, add FK
-- (enum values from Part 1 are now committed and usable)

-- ─── 1. MIGRATE EXISTING ENUM DATA ───────────────────────────

UPDATE "deals" SET "type" = 'PRODUCT' WHERE "type" = 'NEW_CLIENT';
UPDATE "deals" SET "type" = 'OUTSOURCE' WHERE "type" = 'UPSELL';
UPDATE "orders" SET "type" = 'MAINTENANCE' WHERE "type" = 'SUBSCRIPTION';

-- ─── 2. CREATE PRODUCTS TABLE ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "product_category" "ProductCategoryEnum" NOT NULL,
  "product_type" "ProductTypeEnum" NOT NULL,
  "status" "ProductStatusEnum" NOT NULL DEFAULT 'NEW',
  "pm_id" TEXT,
  "deadline" TIMESTAMP(3),
  "description" TEXT,
  "checklist_template_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- ─── 3. CREATE EXTENSIONS TABLE ───────────────────────────────

CREATE TABLE IF NOT EXISTS "extensions" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "product_id" TEXT,
  "name" TEXT NOT NULL,
  "size" "ExtensionSizeEnum" NOT NULL DEFAULT 'SMALL',
  "status" "ExtensionStatusEnum" NOT NULL DEFAULT 'NEW',
  "assigned_to" TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "extensions_pkey" PRIMARY KEY ("id")
);

-- ─── 4. ADD FK COLUMNS ON EXISTING TABLES ─────────────────────

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "product_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "extension_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_product_id_key" ON "orders"("product_id");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_extension_id_key" ON "orders"("extension_id");

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "product_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "extension_id" TEXT;

ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "product_id" TEXT;

ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "product_category" "ProductCategoryEnum";
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "existing_product_id" TEXT;

-- ─── 5. FOREIGN KEYS (idempotent) ─────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_project_id_fkey') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_pm_id_fkey') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_pm_id_fkey"
      FOREIGN KEY ("pm_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extensions_project_id_fkey') THEN
    ALTER TABLE "extensions" ADD CONSTRAINT "extensions_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extensions_product_id_fkey') THEN
    ALTER TABLE "extensions" ADD CONSTRAINT "extensions_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extensions_assigned_to_fkey') THEN
    ALTER TABLE "extensions" ADD CONSTRAINT "extensions_assigned_to_fkey"
      FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_product_id_fkey') THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_extension_id_fkey') THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_extension_id_fkey"
      FOREIGN KEY ("extension_id") REFERENCES "extensions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_product_id_fkey') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_extension_id_fkey') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_extension_id_fkey"
      FOREIGN KEY ("extension_id") REFERENCES "extensions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_product_id_fkey') THEN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_existing_product_id_fkey') THEN
    ALTER TABLE "deals" ADD CONSTRAINT "deals_existing_product_id_fkey"
      FOREIGN KEY ("existing_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

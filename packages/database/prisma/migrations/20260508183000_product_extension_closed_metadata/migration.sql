-- AlterTable
ALTER TABLE "products" ADD COLUMN "closed_at" TIMESTAMP(3),
ADD COLUMN "closed_by_id" TEXT;

-- AlterTable
ALTER TABLE "extensions" ADD COLUMN "closed_at" TIMESTAMP(3),
ADD COLUMN "closed_by_id" TEXT;

-- Backfill: terminal deliveries get closed_at from updated_at (closed_by unknown)
UPDATE "products"
SET "closed_at" = "updated_at"
WHERE "delivery_resolution" IS NOT NULL AND "closed_at" IS NULL;

UPDATE "extensions"
SET "closed_at" = "updated_at"
WHERE "delivery_resolution" IS NOT NULL AND "closed_at" IS NULL;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extensions" ADD CONSTRAINT "extensions_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "products_closed_at_idx" ON "products"("closed_at");

-- CreateIndex
CREATE INDEX "extensions_closed_at_idx" ON "extensions"("closed_at");

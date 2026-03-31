-- AlterTable: Deal — add existing_product_id for Extension deals
ALTER TABLE "deals" ADD COLUMN "existing_product_id" TEXT;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_existing_product_id_fkey"
  FOREIGN KEY ("existing_product_id") REFERENCES "products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

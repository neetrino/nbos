-- Operational Sales assignment on Product. Does not rewrite Deal.seller_id or bonus history.
-- Risk: LOW — nullable column + index.

ALTER TABLE "products"
  ADD COLUMN "seller_id" TEXT;

CREATE INDEX "products_seller_id_idx"
  ON "products"("seller_id");

ALTER TABLE "products"
  ADD CONSTRAINT "products_seller_id_fkey"
  FOREIGN KEY ("seller_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

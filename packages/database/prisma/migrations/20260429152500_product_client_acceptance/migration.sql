ALTER TABLE "products"
  ADD COLUMN "client_accepted_at" TIMESTAMP(3),
  ADD COLUMN "client_accepted_by" TEXT,
  ADD COLUMN "client_acceptance_note" TEXT;

CREATE INDEX "products_client_accepted_at_idx" ON "products"("client_accepted_at");

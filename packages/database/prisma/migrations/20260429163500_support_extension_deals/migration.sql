ALTER TABLE "support_tickets"
  ADD COLUMN "extension_deal_id" TEXT;

CREATE UNIQUE INDEX "support_tickets_extension_deal_id_key" ON "support_tickets"("extension_deal_id");

ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_extension_deal_id_fkey"
  FOREIGN KEY ("extension_deal_id") REFERENCES "deals"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

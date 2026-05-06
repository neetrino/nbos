-- Support ticket ↔ Technical Infrastructure (incident context)

ALTER TABLE "support_tickets" ADD COLUMN "technical_asset_id" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN "technical_environment_id" TEXT;

CREATE INDEX "support_tickets_technical_asset_id_idx" ON "support_tickets"("technical_asset_id");
CREATE INDEX "support_tickets_technical_environment_id_idx" ON "support_tickets"("technical_environment_id");

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_technical_asset_id_fkey" FOREIGN KEY ("technical_asset_id") REFERENCES "technical_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_technical_environment_id_fkey" FOREIGN KEY ("technical_environment_id") REFERENCES "technical_environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Optional delivery team roles on Product (Delivery Board General tab).
ALTER TABLE "products" ADD COLUMN "developer_id" TEXT,
ADD COLUMN "designer_id" TEXT,
ADD COLUMN "technical_specialist_id" TEXT,
ADD COLUMN "qa_lead_id" TEXT;

ALTER TABLE "products" ADD CONSTRAINT "products_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_technical_specialist_id_fkey" FOREIGN KEY ("technical_specialist_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_qa_lead_id_fkey" FOREIGN KEY ("qa_lead_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "products_developer_id_idx" ON "products"("developer_id");
CREATE INDEX "products_designer_id_idx" ON "products"("designer_id");
CREATE INDEX "products_technical_specialist_id_idx" ON "products"("technical_specialist_id");
CREATE INDEX "products_qa_lead_id_idx" ON "products"("qa_lead_id");

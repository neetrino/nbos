-- Manual invoice cards: optional project context + MANUAL type enum value.
ALTER TYPE "InvoiceTypeEnum" ADD VALUE IF NOT EXISTS 'MANUAL';

ALTER TABLE "invoices" ALTER COLUMN "project_id" DROP NOT NULL;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

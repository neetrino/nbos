-- Domain purchase/connection operational facts + durable Expense↔Invoice cycle key.
-- Additive and nullable. Existing money rows are not rewritten.
-- Risk: LOW (nullable columns) / MEDIUM (unique on expenses.source_invoice_id).
-- PostgreSQL unique allows multiple NULLs, so unmatched historical expenses stay valid.

CREATE TYPE "ClientServiceConnectionMode" AS ENUM ('PURCHASE', 'EXISTING_ACCESS', 'CLIENT_DNS');

ALTER TABLE "client_service_records"
  ADD COLUMN "connection_mode" "ClientServiceConnectionMode",
  ADD COLUMN "connection_verified_at" TIMESTAMP(3),
  ADD COLUMN "registration_confirmed_at" TIMESTAMP(3),
  ADD COLUMN "dns_instructions" TEXT,
  ADD COLUMN "encrypted_registrant_data" TEXT,
  ADD COLUMN "registrant_data_updated_at" TIMESTAMP(3);

CREATE INDEX "client_service_records_connection_mode_idx"
  ON "client_service_records"("connection_mode");

ALTER TABLE "expenses"
  ADD COLUMN "source_invoice_id" TEXT;

CREATE UNIQUE INDEX "expenses_source_invoice_id_key"
  ON "expenses"("source_invoice_id");

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_source_invoice_id_fkey"
  FOREIGN KEY ("source_invoice_id") REFERENCES "invoices"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

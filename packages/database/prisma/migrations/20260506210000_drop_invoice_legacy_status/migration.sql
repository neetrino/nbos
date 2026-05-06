-- Finalize money layer: legacy FAIL invoices → CANCELLED before dropping pipeline column
UPDATE "invoices"
SET "money_status" = 'CANCELLED'::"InvoiceMoneyStatusEnum"
WHERE "status"::text = 'FAIL';

-- Drop legacy pipeline column; canonical status is money_status only
ALTER TABLE "invoices" DROP COLUMN "status";

DROP TYPE "InvoiceStatusEnum";

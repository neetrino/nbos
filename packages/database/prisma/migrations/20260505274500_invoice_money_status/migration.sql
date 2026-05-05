-- CreateEnum
CREATE TYPE "InvoiceMoneyStatusEnum" AS ENUM (
  'NEW',
  'AWAITING_PAYMENT',
  'OVERDUE',
  'ON_HOLD',
  'PAID',
  'CANCELLED'
);

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "money_status" "InvoiceMoneyStatusEnum" NOT NULL DEFAULT 'NEW';

-- Backfill from legacy pipeline status (Invoice Card money layer)
UPDATE "invoices"
SET "money_status" = CASE "status"::text
  WHEN 'PAID' THEN 'PAID'::"InvoiceMoneyStatusEnum"
  WHEN 'ON_HOLD' THEN 'ON_HOLD'::"InvoiceMoneyStatusEnum"
  WHEN 'DELAYED' THEN 'OVERDUE'::"InvoiceMoneyStatusEnum"
  WHEN 'WAITING' THEN 'AWAITING_PAYMENT'::"InvoiceMoneyStatusEnum"
  WHEN 'FAIL' THEN 'AWAITING_PAYMENT'::"InvoiceMoneyStatusEnum"
  WHEN 'THIS_MONTH' THEN 'NEW'::"InvoiceMoneyStatusEnum"
  WHEN 'CREATE_INVOICE' THEN 'NEW'::"InvoiceMoneyStatusEnum"
  ELSE 'NEW'::"InvoiceMoneyStatusEnum"
END;

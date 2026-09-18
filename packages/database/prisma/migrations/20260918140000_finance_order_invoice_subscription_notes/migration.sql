-- Optional description/notes on Order, Invoice, and Subscription sheets.

ALTER TABLE "orders" ADD COLUMN "notes" TEXT;
ALTER TABLE "invoices" ADD COLUMN "notes" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "notes" TEXT;

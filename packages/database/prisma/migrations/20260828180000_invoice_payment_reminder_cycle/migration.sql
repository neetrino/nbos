-- Client WhatsApp D-10/D-2 collection cycle. Cancelled starts a new cycle; On Hold does not.

ALTER TABLE "invoices"
  ADD COLUMN "payment_reminder_cycle" INTEGER NOT NULL DEFAULT 0;

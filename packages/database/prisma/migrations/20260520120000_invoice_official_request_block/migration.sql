-- Official Invoice request block on Invoice Card (NBOS Finance canon).

ALTER TABLE "invoices"
  ADD COLUMN "official_invoice_request_sent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "official_invoice_sent_at" TIMESTAMP(3),
  ADD COLUMN "official_invoice_cancelled_at" TIMESTAMP(3),
  ADD COLUMN "notifications_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Legacy rows with gov id imply request was already fulfilled.
UPDATE "invoices"
SET
  "official_invoice_request_sent" = true,
  "official_invoice_sent_at" = COALESCE("updated_at", "created_at")
WHERE "gov_invoice_id" IS NOT NULL;

-- Profile A lifecycle: recoverable Trash for Lead and Deal (Phase 2 CRM).

ALTER TABLE "leads" ADD COLUMN "trashed_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "trashed_at" TIMESTAMP(3);

CREATE INDEX "leads_trashed_at_idx" ON "leads"("trashed_at");
CREATE INDEX "deals_trashed_at_idx" ON "deals"("trashed_at");

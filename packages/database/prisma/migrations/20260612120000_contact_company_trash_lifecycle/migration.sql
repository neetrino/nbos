-- Profile A lifecycle: recoverable Trash for Contact and Company (Phase 1 Clients).

ALTER TABLE "contacts" ADD COLUMN "trashed_at" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "trashed_at" TIMESTAMP(3);

CREATE INDEX "contacts_trashed_at_idx" ON "contacts"("trashed_at");
CREATE INDEX "companies_trashed_at_idx" ON "companies"("trashed_at");

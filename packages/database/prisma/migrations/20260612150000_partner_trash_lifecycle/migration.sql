-- Profile A lifecycle: recoverable Trash for Partner (Phase 5.3).

ALTER TABLE "partners" ADD COLUMN "trashed_at" TIMESTAMP(3);

CREATE INDEX "partners_trashed_at_idx" ON "partners"("trashed_at");

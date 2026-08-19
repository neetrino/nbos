-- Lead merge pointer (Phase 2). Absorbed Lead stays a row: merged_into_id + Profile A Trash.
-- No MERGED stage.

ALTER TABLE "leads" ADD COLUMN "merged_into_id" TEXT;

CREATE INDEX "leads_merged_into_id_idx" ON "leads"("merged_into_id");

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_merged_into_id_fkey"
  FOREIGN KEY ("merged_into_id") REFERENCES "leads"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

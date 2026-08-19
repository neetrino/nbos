-- Contact merge pointer. Absorbed Contact stays a row: merged_into_id + Profile A Trash.
-- No hard delete.

ALTER TABLE "contacts" ADD COLUMN "merged_into_id" TEXT;

CREATE INDEX "contacts_merged_into_id_idx" ON "contacts"("merged_into_id");

ALTER TABLE "contacts"
  ADD CONSTRAINT "contacts_merged_into_id_fkey"
  FOREIGN KEY ("merged_into_id") REFERENCES "contacts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

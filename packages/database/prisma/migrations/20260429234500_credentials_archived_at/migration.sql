-- Soft-delete / archive for credentials (vault row stays; secrets retained until policy purge).
ALTER TABLE "credentials" ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE INDEX "credentials_archived_at_idx" ON "credentials" ("archived_at");

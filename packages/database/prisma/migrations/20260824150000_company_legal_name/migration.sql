-- Official legal name for invoice requisites, separate from display Company.name.
-- Backfill existing rows so Tax invoice gates keep working after the split.

ALTER TABLE "companies" ADD COLUMN "legal_name" TEXT;

UPDATE "companies"
SET "legal_name" = "name"
WHERE "legal_name" IS NULL;

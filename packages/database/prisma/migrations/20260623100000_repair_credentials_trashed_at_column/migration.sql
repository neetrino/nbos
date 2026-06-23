-- Repair: restore credentials.trashed_at (Trash lifecycle canon).
-- Reverses 20260622130000_credentials_archived_at_from_trashed when applied against current Prisma schema.

ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "trashed_at" TIMESTAMP(3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'credentials'
      AND column_name = 'archived_at'
  ) THEN
    UPDATE "credentials"
    SET "trashed_at" = "archived_at"
    WHERE "archived_at" IS NOT NULL
      AND "trashed_at" IS NULL;

    DROP INDEX IF EXISTS "credentials_archived_at_idx";

    ALTER TABLE "credentials" DROP COLUMN "archived_at";
  END IF;
END $$;

DROP INDEX IF EXISTS "credentials_trashed_at_idx";

CREATE INDEX "credentials_trashed_at_idx" ON "credentials"("trashed_at");

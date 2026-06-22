-- Repair: restore projects.trashed_at (Profile A lifecycle).
-- Reverses 20260622120000_projects_is_archived when applied against current Prisma schema.

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "trashed_at" TIMESTAMP(3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'is_archived'
  ) THEN
    UPDATE "projects"
    SET "trashed_at" = "updated_at"
    WHERE "is_archived" = true
      AND "trashed_at" IS NULL;

    ALTER TABLE "projects" DROP COLUMN "is_archived";
  END IF;
END $$;

DROP INDEX IF EXISTS "projects_trashed_at_idx";

CREATE INDEX "projects_trashed_at_idx" ON "projects"("trashed_at");

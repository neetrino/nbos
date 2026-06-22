-- Credentials: transitional trash column rename archived_at → trashed_at (Profile C target naming).
ALTER TABLE "credentials" RENAME COLUMN "archived_at" TO "trashed_at";
ALTER INDEX "credentials_archived_at_idx" RENAME TO "credentials_trashed_at_idx";

-- Projects: drop legacy is_archived boolean; trashed_at is the sole trash signal (Profile A).
ALTER TABLE "projects" DROP COLUMN IF EXISTS "is_archived";

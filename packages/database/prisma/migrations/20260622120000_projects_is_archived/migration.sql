-- Align projects archive column with Prisma schema (is_archived boolean).
-- Legacy DBs used nullable trashed_at; preserve archived rows when migrating.
ALTER TABLE "projects" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;

UPDATE "projects"
SET "is_archived" = true
WHERE "trashed_at" IS NOT NULL;

DROP INDEX IF EXISTS "projects_trashed_at_idx";

ALTER TABLE "projects" DROP COLUMN "trashed_at";

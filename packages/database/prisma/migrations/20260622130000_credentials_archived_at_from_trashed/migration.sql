-- Align credentials archive column with Prisma schema (archived_at timestamp).
-- Legacy DBs used nullable trashed_at from a removed migration; preserve archived rows.
ALTER TABLE "credentials" ADD COLUMN "archived_at" TIMESTAMP(3);

UPDATE "credentials"
SET "archived_at" = "trashed_at"
WHERE "trashed_at" IS NOT NULL;

DROP INDEX IF EXISTS "credentials_trashed_at_idx";

ALTER TABLE "credentials" DROP COLUMN "trashed_at";

CREATE INDEX "credentials_archived_at_idx" ON "credentials" ("archived_at");

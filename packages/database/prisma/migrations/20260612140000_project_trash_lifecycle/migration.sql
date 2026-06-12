-- Profile A lifecycle: Project trash (Phase 3). Backfill from legacy is_archived.

ALTER TABLE "projects" ADD COLUMN "trashed_at" TIMESTAMP(3);

UPDATE "projects"
SET "trashed_at" = "updated_at"
WHERE "is_archived" = true AND "trashed_at" IS NULL;

CREATE INDEX "projects_trashed_at_idx" ON "projects"("trashed_at");

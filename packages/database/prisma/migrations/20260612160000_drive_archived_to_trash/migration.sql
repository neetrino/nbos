-- Drive 6.3: migrate legacy ARCHIVED file_assets rows to unified Trash (DELETED + deleted_at).
UPDATE "file_assets"
SET
  "status" = 'DELETED',
  "deleted_at" = COALESCE("archived_at", "updated_at"),
  "archived_at" = NULL,
  "updated_at" = NOW()
WHERE "status" = 'ARCHIVED'
  AND "deleted_at" IS NULL;

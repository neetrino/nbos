-- Model 6: folders use empty-only hard delete; archived_at on credential_folders is unused legacy.
UPDATE "credential_folders"
SET "archived_at" = NULL
WHERE "archived_at" IS NOT NULL;

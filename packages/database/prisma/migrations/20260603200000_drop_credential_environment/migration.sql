-- Credential vault: environment context lives in title, not a separate column.
DROP INDEX IF EXISTS "credentials_environment_idx";
ALTER TABLE "credentials" DROP COLUMN IF EXISTS "environment";

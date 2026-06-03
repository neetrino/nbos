-- Credential sheet 1c: SSH passphrase, App Store phones/platform.

CREATE TYPE "AppStorePlatformEnum" AS ENUM ('APPLE', 'GOOGLE');

ALTER TABLE "credentials"
  ADD COLUMN "passphrase" TEXT,
  ADD COLUMN "phones" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "app_store_platform" "AppStorePlatformEnum";

-- Backfill phones from legacy single phone column.
UPDATE "credentials"
SET "phones" = ARRAY["phone"]
WHERE "phone" IS NOT NULL AND "phone" <> '' AND cardinality("phones") = 0;

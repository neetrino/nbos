-- Credential provider registry (shared catalog) + FK on credentials.

CREATE TABLE "credential_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "is_seeded" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credential_providers_slug_key" ON "credential_providers"("slug");
CREATE INDEX "credential_providers_name_idx" ON "credential_providers"("name");

ALTER TABLE "credentials" ADD COLUMN "provider_id" TEXT;

ALTER TABLE "credentials" DROP COLUMN IF EXISTS "provider";

ALTER TABLE "credentials" ADD CONSTRAINT "credentials_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "credential_providers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "credentials_provider_id_idx" ON "credentials"("provider_id");

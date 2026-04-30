-- Credentials P0: secure notes, credential type, context links and rotation metadata.

CREATE TYPE "CredentialTypeEnum" AS ENUM (
  'LOGIN_PASSWORD',
  'API_KEY',
  'DATABASE',
  'SSH_PRIVATE_KEY',
  'ENV_BUNDLE',
  'DOMAIN_REGISTRAR',
  'HOSTING_SERVER',
  'APP_STORE_ACCOUNT',
  'MAIL_SMTP',
  'RECOVERY_CODES',
  'OTHER_SECRET'
);

CREATE TYPE "CredentialCriticalityEnum" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

ALTER TABLE "credentials"
  ADD COLUMN "product_id" TEXT,
  ADD COLUMN "domain_id" TEXT,
  ADD COLUMN "client_service_record_id" TEXT,
  ADD COLUMN "credential_type" "CredentialTypeEnum" NOT NULL DEFAULT 'LOGIN_PASSWORD',
  ADD COLUMN "criticality" "CredentialCriticalityEnum" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "environment" TEXT,
  ADD COLUMN "public_notes" TEXT,
  ADD COLUMN "secure_notes" TEXT,
  ADD COLUMN "last_rotated_at" TIMESTAMP(3),
  ADD COLUMN "next_rotation_at" TIMESTAMP(3),
  ADD COLUMN "rotation_owner_id" TEXT;

UPDATE "credentials"
SET "public_notes" = "notes"
WHERE "notes" IS NOT NULL AND "public_notes" IS NULL;

CREATE INDEX "credentials_project_id_idx" ON "credentials"("project_id");
CREATE INDEX "credentials_product_id_idx" ON "credentials"("product_id");
CREATE INDEX "credentials_domain_id_idx" ON "credentials"("domain_id");
CREATE INDEX "credentials_client_service_record_id_idx" ON "credentials"("client_service_record_id");
CREATE INDEX "credentials_category_idx" ON "credentials"("category");
CREATE INDEX "credentials_credential_type_idx" ON "credentials"("credential_type");
CREATE INDEX "credentials_criticality_idx" ON "credentials"("criticality");
CREATE INDEX "credentials_environment_idx" ON "credentials"("environment");
CREATE INDEX "credentials_access_level_idx" ON "credentials"("access_level");
CREATE INDEX "credentials_owner_id_idx" ON "credentials"("owner_id");
CREATE INDEX "credentials_next_rotation_at_idx" ON "credentials"("next_rotation_at");

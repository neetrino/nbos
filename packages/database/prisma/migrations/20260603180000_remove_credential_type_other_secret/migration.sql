-- Remove legacy OTHER_SECRET credential type (reclassify rows to API_KEY).

UPDATE "credentials"
SET "credential_type" = 'API_KEY'
WHERE "credential_type" = 'OTHER_SECRET';

CREATE TYPE "CredentialTypeEnum_new" AS ENUM (
  'LOGIN_PASSWORD',
  'API_KEY',
  'DATABASE',
  'SSH_PRIVATE_KEY',
  'ENV_BUNDLE',
  'DOMAIN_REGISTRAR',
  'HOSTING_SERVER',
  'APP_STORE_ACCOUNT',
  'MAIL_SMTP',
  'RECOVERY_CODES'
);

ALTER TABLE "credentials" ALTER COLUMN "credential_type" DROP DEFAULT;

ALTER TABLE "credentials"
  ALTER COLUMN "credential_type" TYPE "CredentialTypeEnum_new"
  USING ("credential_type"::text::"CredentialTypeEnum_new");

DROP TYPE "CredentialTypeEnum";

ALTER TYPE "CredentialTypeEnum_new" RENAME TO "CredentialTypeEnum";

ALTER TABLE "credentials"
  ALTER COLUMN "credential_type" SET DEFAULT 'LOGIN_PASSWORD'::"CredentialTypeEnum";

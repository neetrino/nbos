-- Technical Infrastructure P0: product technical profiles, assets and environments.

CREATE TYPE "TechnicalHealthStatus" AS ENUM (
  'HEALTHY',
  'WARNING',
  'CRITICAL',
  'NOT_CONFIGURED',
  'UNKNOWN'
);

CREATE TYPE "TechnicalBackupStatus" AS ENUM (
  'HEALTHY',
  'WARNING',
  'MISSING',
  'NOT_REQUIRED',
  'UNKNOWN'
);

CREATE TYPE "TechnicalDeployStatus" AS ENUM (
  'SUCCESS',
  'FAILED',
  'ROLLED_BACK',
  'UNKNOWN'
);

CREATE TYPE "TechnicalAssetType" AS ENUM (
  'DOMAIN',
  'HOSTING',
  'REPOSITORY',
  'DATABASE',
  'STORAGE',
  'MONITORING',
  'ERROR_TRACKING',
  'EXTERNAL_API',
  'QUEUE',
  'OTHER'
);

CREATE TYPE "TechnicalAssetStatus" AS ENUM (
  'ACTIVE',
  'WARNING',
  'BROKEN',
  'DEPRECATED',
  'UNKNOWN'
);

CREATE TYPE "TechnicalEnvironmentKind" AS ENUM (
  'PRODUCTION',
  'STAGING',
  'DEVELOPMENT',
  'PREVIEW',
  'LEGACY'
);

CREATE TABLE "product_technical_profiles" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "technical_owner_id" TEXT,
  "production_url" TEXT,
  "staging_url" TEXT,
  "repository_url" TEXT,
  "deployment_method" TEXT,
  "hosting_provider" TEXT,
  "monitoring_status" "TechnicalHealthStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
  "backup_status" "TechnicalBackupStatus" NOT NULL DEFAULT 'UNKNOWN',
  "last_deploy_at" TIMESTAMP(3),
  "last_deploy_status" "TechnicalDeployStatus" NOT NULL DEFAULT 'UNKNOWN',
  "technical_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_technical_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technical_assets" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "type" "TechnicalAssetType" NOT NULL,
  "name" TEXT NOT NULL,
  "provider" TEXT,
  "environment" "TechnicalEnvironmentKind",
  "status" "TechnicalAssetStatus" NOT NULL DEFAULT 'UNKNOWN',
  "url" TEXT,
  "owner_id" TEXT,
  "credential_id" TEXT,
  "client_service_record_id" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "technical_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technical_environments" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "kind" "TechnicalEnvironmentKind" NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT,
  "branch" TEXT,
  "deployment_target" TEXT,
  "env_credential_id" TEXT,
  "database_asset_id" TEXT,
  "status" "TechnicalHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
  "last_checked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "technical_environments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_technical_profiles_product_id_key" ON "product_technical_profiles"("product_id");
CREATE INDEX "product_technical_profiles_project_id_idx" ON "product_technical_profiles"("project_id");
CREATE INDEX "product_technical_profiles_technical_owner_id_idx" ON "product_technical_profiles"("technical_owner_id");
CREATE INDEX "technical_assets_product_id_idx" ON "technical_assets"("product_id");
CREATE INDEX "technical_assets_project_id_idx" ON "technical_assets"("project_id");
CREATE INDEX "technical_assets_type_idx" ON "technical_assets"("type");
CREATE INDEX "technical_assets_status_idx" ON "technical_assets"("status");
CREATE INDEX "technical_environments_product_id_idx" ON "technical_environments"("product_id");
CREATE INDEX "technical_environments_project_id_idx" ON "technical_environments"("project_id");
CREATE INDEX "technical_environments_kind_idx" ON "technical_environments"("kind");
CREATE INDEX "technical_environments_status_idx" ON "technical_environments"("status");

ALTER TABLE "product_technical_profiles"
  ADD CONSTRAINT "product_technical_profiles_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_technical_profiles"
  ADD CONSTRAINT "product_technical_profiles_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "technical_assets"
  ADD CONSTRAINT "technical_assets_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "technical_assets"
  ADD CONSTRAINT "technical_assets_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "technical_environments"
  ADD CONSTRAINT "technical_environments_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "technical_environments"
  ADD CONSTRAINT "technical_environments_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "FileAssetTypeEnum" AS ENUM (
  'DOCUMENT',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'ARCHIVE',
  'CODE',
  'SPREADSHEET',
  'LINK',
  'OTHER'
);

CREATE TYPE "FilePurposeEnum" AS ENUM (
  'OFFER_DRAFT',
  'OFFER_SENT',
  'OFFER_APPROVED',
  'MESSENGER_PROOF',
  'CONTRACT',
  'HANDOFF_DOCUMENT',
  'DESIGN_ASSET',
  'DELIVERY_FILE',
  'INVOICE_REQUEST_PROOF',
  'PAYMENT_PROOF',
  'EXPENSE_PROOF',
  'PARTNER_AGREEMENT',
  'SUPPORT_EVIDENCE',
  'TASK_ATTACHMENT',
  'WORKSPACE_ARTIFACT',
  'SOP_DOCUMENT',
  'TRAINING_MATERIAL',
  'MEETING_RECORDING',
  'CALL_RECORDING',
  'OTHER'
);

CREATE TYPE "FileAssetStatusEnum" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'APPROVED',
  'ARCHIVED',
  'DELETED'
);

CREATE TYPE "FileVisibilityEnum" AS ENUM (
  'INTERNAL',
  'PROJECT_TEAM',
  'RESTRICTED',
  'CLIENT_VISIBLE',
  'PARTNER_VISIBLE',
  'PERSONAL'
);

CREATE TYPE "FileConfidentialityEnum" AS ENUM (
  'PUBLIC_INTERNAL',
  'CONFIDENTIAL',
  'FINANCE_SENSITIVE',
  'LEGAL_SENSITIVE',
  'SECRET_ADJACENT'
);

CREATE TYPE "FileStorageProviderEnum" AS ENUM (
  'R2',
  'EXTERNAL_URL',
  'GOOGLE_DRIVE'
);

CREATE TYPE "FileLinkTypeEnum" AS ENUM (
  'ATTACHMENT',
  'APPROVED_DOCUMENT',
  'PROOF',
  'SOURCE_MATERIAL',
  'FINAL_DELIVERY',
  'HANDOFF',
  'SUPPORT_EVIDENCE',
  'TASK_ATTACHMENT',
  'WORKSPACE_ARTIFACT',
  'OTHER'
);

CREATE TABLE "file_assets" (
  "id" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "original_name" TEXT,
  "file_type" "FileAssetTypeEnum" NOT NULL,
  "purpose" "FilePurposeEnum",
  "source_module" TEXT,
  "owner_id" TEXT,
  "created_by_id" TEXT,
  "status" "FileAssetStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  "visibility" "FileVisibilityEnum" NOT NULL DEFAULT 'INTERNAL',
  "confidentiality" "FileConfidentialityEnum" NOT NULL DEFAULT 'CONFIDENTIAL',
  "storage_provider" "FileStorageProviderEnum" NOT NULL DEFAULT 'R2',
  "storage_key" TEXT,
  "external_url" TEXT,
  "mime_type" TEXT,
  "size_bytes" BIGINT,
  "checksum" TEXT,
  "current_version_id" TEXT,
  "retention_policy" TEXT,
  "deleted_at" TIMESTAMP(3),
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "file_versions" (
  "id" TEXT NOT NULL,
  "file_asset_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "storage_key" TEXT,
  "uploaded_by_id" TEXT,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "change_note" TEXT,
  "size_bytes" BIGINT,
  "checksum" TEXT,
  "is_current" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "file_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "file_links" (
  "id" TEXT NOT NULL,
  "file_asset_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "link_type" "FileLinkTypeEnum" NOT NULL DEFAULT 'ATTACHMENT',
  "purpose_override" "FilePurposeEnum",
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "linked_by_id" TEXT,
  "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unlinked_at" TIMESTAMP(3),
  CONSTRAINT "file_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "file_audit_events" (
  "id" TEXT NOT NULL,
  "file_asset_id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "file_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "file_versions_file_asset_id_version_number_key" ON "file_versions"("file_asset_id", "version_number");
CREATE INDEX "file_assets_status_idx" ON "file_assets"("status");
CREATE INDEX "file_assets_purpose_idx" ON "file_assets"("purpose");
CREATE INDEX "file_assets_source_module_idx" ON "file_assets"("source_module");
CREATE INDEX "file_assets_storage_key_idx" ON "file_assets"("storage_key");
CREATE INDEX "file_assets_created_at_idx" ON "file_assets"("created_at");
CREATE INDEX "file_versions_is_current_idx" ON "file_versions"("is_current");
CREATE INDEX "file_links_entity_type_entity_id_idx" ON "file_links"("entity_type", "entity_id");
CREATE INDEX "file_links_file_asset_id_idx" ON "file_links"("file_asset_id");
CREATE INDEX "file_links_unlinked_at_idx" ON "file_links"("unlinked_at");
CREATE INDEX "file_audit_events_file_asset_id_idx" ON "file_audit_events"("file_asset_id");
CREATE INDEX "file_audit_events_actor_id_idx" ON "file_audit_events"("actor_id");
CREATE INDEX "file_audit_events_created_at_idx" ON "file_audit_events"("created_at");

ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "file_links" ADD CONSTRAINT "file_links_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "file_audit_events" ADD CONSTRAINT "file_audit_events_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

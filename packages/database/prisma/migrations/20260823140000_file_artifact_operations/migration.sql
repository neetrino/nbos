-- Unified Drive Artifact Operation lifecycle (NEW CHAT 3 / K209 / C24).
-- Additive: new enums + independent table. No existing column, table, or
-- FileUploadSession writer is dropped. Human upload sessions stay readable.
--
-- R2 and PostgreSQL are not one ACID transaction. This row persists operation
-- and storage identity before irreversible upload so crash/retry can resume
-- without a second object, FileAsset, FileVersion, or FileLink.
--
-- Risk: LOW for schema (new table). Rolling deploy of mixed old/new artifact
-- writers is NOT safe for machine/AI attach: old createGeneratedFileAsset
-- can PutObject without a row. Cut over all API/worker processes together
-- (write pause for attach/generate/version-upload). See
-- docs/NBOS/02-Modules/21-AI-Platform/35-Post-Phase-1-Chat-3-Drive-Artifact-Lifecycle-Handoff.md.
--
-- Production: do not apply from this chat.

CREATE TYPE "FileArtifactOperationSourceEnum" AS ENUM (
  'HUMAN',
  'INTERNAL_AI',
  'EXTERNAL_AI',
  'SYSTEM'
);

CREATE TYPE "FileArtifactOperationKindEnum" AS ENUM (
  'CREATE_ASSET',
  'CREATE_VERSION'
);

CREATE TYPE "FileArtifactOperationIngressEnum" AS ENUM (
  'PRESIGNED',
  'MACHINE_PUT'
);

CREATE TYPE "FileArtifactOperationStatusEnum" AS ENUM (
  'PREPARED',
  'UPLOAD_PENDING',
  'OBJECT_UPLOADED',
  'OBJECT_VERIFIED',
  'COMPLETED',
  'FAILED_RETRYABLE',
  'FAILED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TABLE "file_artifact_operations" (
  "id" TEXT NOT NULL,
  "status" "FileArtifactOperationStatusEnum" NOT NULL DEFAULT 'PREPARED',
  "source" "FileArtifactOperationSourceEnum" NOT NULL,
  "ingress" "FileArtifactOperationIngressEnum" NOT NULL,
  "kind" "FileArtifactOperationKindEnum" NOT NULL DEFAULT 'CREATE_ASSET',
  "storage_key" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "target_file_asset_id" TEXT,
  "display_name" TEXT NOT NULL,
  "original_name" TEXT,
  "mime_type" TEXT,
  "purpose" "FilePurposeEnum",
  "source_module" TEXT,
  "visibility" "FileVisibilityEnum" NOT NULL DEFAULT 'INTERNAL',
  "confidentiality" "FileConfidentialityEnum" NOT NULL DEFAULT 'CONFIDENTIAL',
  "link_type" "FileLinkTypeEnum" NOT NULL DEFAULT 'ATTACHMENT',
  "expected_size_bytes" BIGINT,
  "checksum" TEXT,
  "payload_fingerprint" TEXT,
  "created_by_employee_id" TEXT,
  "actor_type" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "agent_id" TEXT,
  "correlation_id" TEXT,
  "idempotency_key" TEXT,
  "folder_id" TEXT,
  "file_asset_id" TEXT,
  "file_version_id" TEXT,
  "file_link_id" TEXT,
  "object_verified_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "failed_reason" TEXT,
  "recovery_attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_recovery_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "file_artifact_operations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "file_artifact_operations_storage_key_key"
  ON "file_artifact_operations"("storage_key");

CREATE UNIQUE INDEX "file_artifact_operations_source_actor_idempotency_uidx"
  ON "file_artifact_operations"("source", "actor_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

CREATE INDEX "file_artifact_operations_status_expires_at_idx"
  ON "file_artifact_operations"("status", "expires_at");

CREATE INDEX "file_artifact_operations_status_updated_at_idx"
  ON "file_artifact_operations"("status", "updated_at");

CREATE INDEX "file_artifact_operations_source_actor_idempotency_idx"
  ON "file_artifact_operations"("source", "actor_id", "idempotency_key");

CREATE INDEX "file_artifact_operations_agent_id_idempotency_key_idx"
  ON "file_artifact_operations"("agent_id", "idempotency_key");

CREATE INDEX "file_artifact_operations_entity_type_entity_id_idx"
  ON "file_artifact_operations"("entity_type", "entity_id");

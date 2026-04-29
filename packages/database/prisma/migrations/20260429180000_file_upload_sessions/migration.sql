-- CreateEnum
CREATE TYPE "FileUploadSessionStatusEnum" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "file_upload_sessions" (
    "id" TEXT NOT NULL,
    "status" "FileUploadSessionStatusEnum" NOT NULL DEFAULT 'PENDING',
    "storage_key" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT,
    "purpose" "FilePurposeEnum",
    "source_module" TEXT,
    "visibility" "FileVisibilityEnum" NOT NULL DEFAULT 'INTERNAL',
    "confidentiality" "FileConfidentialityEnum" NOT NULL DEFAULT 'CONFIDENTIAL',
    "link_type" "FileLinkTypeEnum" NOT NULL DEFAULT 'ATTACHMENT',
    "created_by_id" TEXT,
    "file_asset_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "failed_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_upload_sessions_status_expires_at_idx" ON "file_upload_sessions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "file_upload_sessions_created_by_id_idx" ON "file_upload_sessions"("created_by_id");

-- CreateIndex
CREATE INDEX "file_upload_sessions_entity_type_entity_id_idx" ON "file_upload_sessions"("entity_type", "entity_id");

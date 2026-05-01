-- CreateEnum
CREATE TYPE "DocumentTypeEnum" AS ENUM ('NATIVE', 'UPLOADED_FILE', 'EXTERNAL_LINK', 'GOOGLE_DOC', 'GOOGLE_SHEET');

-- CreateEnum
CREATE TYPE "DocumentStatusEnum" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentContentStorageEnum" AS ENUM ('DB', 'R2', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ExternalLinkProviderEnum" AS ENUM ('MANUAL_URL', 'GOOGLE_DOCS', 'GOOGLE_SHEETS', 'GOOGLE_DRIVE');

-- CreateEnum
CREATE TYPE "DocumentAttachmentPurposeEnum" AS ENUM ('INLINE_IMAGE', 'ATTACHMENT', 'COVER', 'SOURCE_FILE', 'EXPORT');

-- CreateTable
CREATE TABLE "document_sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "default_visibility" "FileVisibilityEnum" NOT NULL DEFAULT 'INTERNAL',
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_document_links" (
    "id" TEXT NOT NULL,
    "provider" "ExternalLinkProviderEnum" NOT NULL,
    "url" TEXT NOT NULL,
    "external_id" TEXT,
    "title" TEXT,
    "mime_type" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_document_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "type" "DocumentTypeEnum" NOT NULL DEFAULT 'NATIVE',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "section_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "status" "DocumentStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "owner_id" TEXT,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "published_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "content_json" JSONB,
    "content_html" TEXT,
    "plain_text" TEXT,
    "cover_file_asset_id" TEXT,
    "external_document_link_id" TEXT,
    "visibility" "FileVisibilityEnum" NOT NULL DEFAULT 'INTERNAL',
    "content_storage" "DocumentContentStorageEnum" NOT NULL DEFAULT 'DB',
    "content_object_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_tag_links" (
    "document_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_tag_links_pkey" PRIMARY KEY ("document_id","tag_id")
);

-- CreateTable
CREATE TABLE "document_attachments" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "file_asset_id" TEXT NOT NULL,
    "purpose" "DocumentAttachmentPurposeEnum" NOT NULL DEFAULT 'ATTACHMENT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_activity_events" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_sections_slug_key" ON "document_sections"("slug");

-- CreateIndex
CREATE INDEX "document_sections_parent_id_idx" ON "document_sections"("parent_id");

-- CreateIndex
CREATE INDEX "document_sections_sort_order_idx" ON "document_sections"("sort_order");

-- CreateIndex
CREATE INDEX "external_document_links_provider_idx" ON "external_document_links"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "documents_slug_key" ON "documents"("slug");

-- CreateIndex
CREATE INDEX "documents_section_id_idx" ON "documents"("section_id");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_created_at_idx" ON "documents"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "document_tags_slug_key" ON "document_tags"("slug");

-- CreateIndex
CREATE INDEX "document_tags_name_idx" ON "document_tags"("name");

-- CreateIndex
CREATE INDEX "document_tag_links_tag_id_idx" ON "document_tag_links"("tag_id");

-- CreateIndex
CREATE INDEX "document_attachments_document_id_idx" ON "document_attachments"("document_id");

-- CreateIndex
CREATE INDEX "document_attachments_file_asset_id_idx" ON "document_attachments"("file_asset_id");

-- CreateIndex
CREATE INDEX "document_activity_events_document_id_idx" ON "document_activity_events"("document_id");

-- CreateIndex
CREATE INDEX "document_activity_events_actor_id_idx" ON "document_activity_events"("actor_id");

-- CreateIndex
CREATE INDEX "document_activity_events_created_at_idx" ON "document_activity_events"("created_at");

-- AddForeignKey
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "document_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "document_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_cover_file_asset_id_fkey" FOREIGN KEY ("cover_file_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_external_document_link_id_fkey" FOREIGN KEY ("external_document_link_id") REFERENCES "external_document_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_tag_links" ADD CONSTRAINT "document_tag_links_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_tag_links" ADD CONSTRAINT "document_tag_links_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "document_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachments" ADD CONSTRAINT "document_attachments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachments" ADD CONSTRAINT "document_attachments_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_activity_events" ADD CONSTRAINT "document_activity_events_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

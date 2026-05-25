-- CreateEnum
CREATE TYPE "ChecklistTemplateStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChecklistTemplateCategoryEnum" AS ENUM (
  'DELIVERY',
  'MAINTENANCE',
  'QA',
  'TECHNICAL',
  'SOP',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "ChecklistOwnerModuleEnum" AS ENUM ('MY_COMPANY', 'PROJECTS', 'TASKS', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "ChecklistTemplateVersionStatusEnum" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "checklist_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" "ChecklistTemplateCategoryEnum" NOT NULL,
  "owner_module" "ChecklistOwnerModuleEnum" NOT NULL,
  "status" "ChecklistTemplateStatusEnum" NOT NULL DEFAULT 'DRAFT',
  "active_version_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_versions" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "status" "ChecklistTemplateVersionStatusEnum" NOT NULL DEFAULT 'DRAFT',
  "items" JSONB NOT NULL,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "checklist_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_instances" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "template_version_id" TEXT NOT NULL,
  "owner_entity_type" TEXT NOT NULL,
  "owner_entity_id" TEXT NOT NULL,
  "snapshot_items" JSONB NOT NULL,
  "completed_at" TIMESTAMP(3),
  "completed_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "checklist_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_templates_active_version_id_key" ON "checklist_templates"("active_version_id");

-- CreateIndex
CREATE INDEX "checklist_templates_status_idx" ON "checklist_templates"("status");

-- CreateIndex
CREATE INDEX "checklist_templates_category_idx" ON "checklist_templates"("category");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_template_versions_template_id_version_number_key" ON "checklist_template_versions"("template_id", "version_number");

-- CreateIndex
CREATE INDEX "checklist_template_versions_template_id_idx" ON "checklist_template_versions"("template_id");

-- CreateIndex
CREATE INDEX "checklist_instances_owner_entity_type_owner_entity_id_idx" ON "checklist_instances"("owner_entity_type", "owner_entity_id");

-- CreateIndex
CREATE INDEX "checklist_instances_template_id_idx" ON "checklist_instances"("template_id");

-- AddForeignKey
ALTER TABLE "checklist_template_versions"
ADD CONSTRAINT "checklist_template_versions_template_id_fkey"
FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_versions"
ADD CONSTRAINT "checklist_template_versions_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_templates"
ADD CONSTRAINT "checklist_templates_active_version_id_fkey"
FOREIGN KEY ("active_version_id") REFERENCES "checklist_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances"
ADD CONSTRAINT "checklist_instances_template_id_fkey"
FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances"
ADD CONSTRAINT "checklist_instances_template_version_id_fkey"
FOREIGN KEY ("template_version_id") REFERENCES "checklist_template_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances"
ADD CONSTRAINT "checklist_instances_completed_by_id_fkey"
FOREIGN KEY ("completed_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Clear legacy free-text references before FK (templates table starts empty)
UPDATE "products" SET "checklist_template_id" = NULL WHERE "checklist_template_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "products"
ADD CONSTRAINT "products_checklist_template_id_fkey"
FOREIGN KEY ("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

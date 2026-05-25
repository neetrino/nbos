-- CreateEnum
CREATE TYPE "DeliveryChecklistTargetEnum" AS ENUM ('PRODUCT', 'EXTENSION');

-- AlterTable
ALTER TABLE "checklist_instances" ADD COLUMN "delivery_stage" "DeliveryStageEnum";

-- CreateIndex
CREATE INDEX "checklist_instances_owner_entity_type_owner_entity_id_delivery_st_idx" ON "checklist_instances"("owner_entity_type", "owner_entity_id", "delivery_stage");

-- CreateTable
CREATE TABLE "delivery_stage_checklist_rules" (
    "id" TEXT NOT NULL,
    "target" "DeliveryChecklistTargetEnum" NOT NULL,
    "delivery_stage" "DeliveryStageEnum" NOT NULL,
    "checklist_template_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "filter_product_category" "ProductCategoryEnum",
    "filter_product_type" "ProductTypeEnum",
    "filter_extension_size" "ExtensionSizeEnum",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_stage_checklist_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_stage_checklist_rules_target_delivery_stage_is_active_idx" ON "delivery_stage_checklist_rules"("target", "delivery_stage", "is_active");

-- AddForeignKey
ALTER TABLE "delivery_stage_checklist_rules" ADD CONSTRAINT "delivery_stage_checklist_rules_checklist_template_id_fkey" FOREIGN KEY ("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

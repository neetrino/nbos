-- Extension.size is not an attribute. Checklist rules stay; a size-only rule
-- matches every extension once this column is gone. Extension rows stay.

ALTER TABLE "delivery_stage_checklist_rules" DROP COLUMN "filter_extension_size";

ALTER TABLE "extensions" DROP COLUMN "size";

DROP TYPE "ExtensionSizeEnum";

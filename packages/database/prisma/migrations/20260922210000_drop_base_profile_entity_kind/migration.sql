-- An extension has no core norm. Archive any extension cores, then drop the axis.
-- DeliveryConfiguration.entity_kind stays. Extension.size is dropped in a later migration.

-- Drop the kind so a later product-core save cannot continue this key or this
-- version. Configurations keep their foreign key to the row.
UPDATE "delivery_base_profile_versions"
SET "status" = 'ARCHIVED',
    "product_type" = NULL,
    "profile_key" = 'retired-extension-' || "id"
WHERE "entity_kind" = 'EXTENSION';

DROP INDEX IF EXISTS "delivery_base_profile_versions_entity_kind_status_idx";

ALTER TABLE "delivery_base_profile_versions" DROP COLUMN "entity_kind";

CREATE INDEX "delivery_base_profile_versions_product_type_status_idx"
  ON "delivery_base_profile_versions"("product_type", "status");

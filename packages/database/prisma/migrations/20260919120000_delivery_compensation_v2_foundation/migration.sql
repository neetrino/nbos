-- Delivery Compensation v2 foundation.
-- Risk: MEDIUM — additive tables + nullable BonusEntry anchors. No money backfill.
-- Do NOT apply except on a confirmed disposable/local Postgres. Not a production migrate.
-- NETWORK / Sales sources are intentionally omitted (S15).
-- Existing products stay implicit LEGACY (no configuration row).

-- ── enums ──────────────────────────────────────────────────

CREATE TYPE "DeliveryFunctionStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "DeliveryNormativeStatusEnum" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "DeliveryCompensationRoleKeyEnum" AS ENUM (
  'BACKEND', 'FRONTEND', 'PM', 'DESIGNER', 'QA', 'TECHNICAL_SPECIALIST'
);
CREATE TYPE "DeliveryRoleUnitKindEnum" AS ENUM ('REQUIRED', 'NOT_REQUIRED');
CREATE TYPE "DeliveryEntityKindEnum" AS ENUM ('PRODUCT', 'EXTENSION');
CREATE TYPE "DeliveryConfigSizeEnum" AS ENUM ('SMALL', 'CLASSIC', 'LARGE', 'VERY_LARGE', 'ENTERPRISE');
CREATE TYPE "DeliveryImplementationBaseEnum" AS ENUM ('FROM_SCRATCH', 'EXISTING_BASE', 'WHITE_LABEL');
CREATE TYPE "DeliveryDesignModeEnum" AS ENUM ('AI_DESIGN', 'CONCEPT', 'FULL_DESIGN');
CREATE TYPE "DeliveryFeatureOriginEnum" AS ENUM ('INCLUDED', 'EXTRA');
CREATE TYPE "DeliveryFeatureWorkStateEnum" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACCEPTED');
CREATE TYPE "DeliveryConfigurationModeEnum" AS ENUM ('LEGACY', 'V2');
CREATE TYPE "DeliveryBonusSourceEnum" AS ENUM ('DELIVERY_CONFIGURATOR_V2');
CREATE TYPE "DeliveryBonusComponentKindEnum" AS ENUM ('BASE', 'FEATURE');

-- ── catalog ────────────────────────────────────────────────

CREATE TABLE "delivery_functions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon_key" TEXT NOT NULL,
    "status" "DeliveryFunctionStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_functions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_functions_code_key" ON "delivery_functions"("code");
CREATE INDEX "delivery_functions_status_idx" ON "delivery_functions"("status");
CREATE INDEX "delivery_functions_category_idx" ON "delivery_functions"("category");

CREATE TABLE "delivery_function_content_versions" (
    "id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "scope_boundaries" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "acceptance_criteria" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_function_content_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_function_content_versions_function_id_version_key"
  ON "delivery_function_content_versions"("function_id", "version");
CREATE INDEX "delivery_function_content_versions_function_id_idx"
  ON "delivery_function_content_versions"("function_id");

CREATE TABLE "delivery_function_attachments" (
    "id" TEXT NOT NULL,
    "content_version_id" TEXT NOT NULL,
    "file_asset_id" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "delivery_function_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "delivery_function_attachments_content_version_id_idx"
  ON "delivery_function_attachments"("content_version_id");
CREATE INDEX "delivery_function_attachments_file_asset_id_idx"
  ON "delivery_function_attachments"("file_asset_id");

CREATE TABLE "delivery_function_price_versions" (
    "id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DeliveryNormativeStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "published_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_function_price_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_function_price_versions_function_id_version_key"
  ON "delivery_function_price_versions"("function_id", "version");
CREATE INDEX "delivery_function_price_versions_function_id_status_idx"
  ON "delivery_function_price_versions"("function_id", "status");
CREATE UNIQUE INDEX "delivery_function_price_versions_one_published"
  ON "delivery_function_price_versions"("function_id")
  WHERE "status" = 'PUBLISHED';

CREATE TABLE "delivery_function_price_role_units" (
    "id" TEXT NOT NULL,
    "price_version_id" TEXT NOT NULL,
    "role_key" "DeliveryCompensationRoleKeyEnum" NOT NULL,
    "unit_kind" "DeliveryRoleUnitKindEnum" NOT NULL,
    "units" DECIMAL(14, 4),

    CONSTRAINT "delivery_function_price_role_units_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_function_price_role_units_kind_units_chk" CHECK (
      ("unit_kind" = 'NOT_REQUIRED' AND "units" IS NULL)
      OR ("unit_kind" = 'REQUIRED')
    )
);

CREATE UNIQUE INDEX "delivery_function_price_role_units_price_version_id_role_key_key"
  ON "delivery_function_price_role_units"("price_version_id", "role_key");

CREATE TABLE "delivery_base_profile_versions" (
    "id" TEXT NOT NULL,
    "profile_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "entity_kind" "DeliveryEntityKindEnum" NOT NULL,
    "product_type" "ProductTypeEnum",
    "product_category" "ProductCategoryEnum",
    "config_size" "DeliveryConfigSizeEnum" NOT NULL,
    "implementation_base" "DeliveryImplementationBaseEnum" NOT NULL,
    "design_mode" "DeliveryDesignModeEnum" NOT NULL,
    "ai_designer_review" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "status" "DeliveryNormativeStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "published_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_base_profile_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_base_profile_versions_profile_key_version_key"
  ON "delivery_base_profile_versions"("profile_key", "version");
CREATE INDEX "delivery_base_profile_versions_profile_key_status_idx"
  ON "delivery_base_profile_versions"("profile_key", "status");
CREATE INDEX "delivery_base_profile_versions_entity_kind_status_idx"
  ON "delivery_base_profile_versions"("entity_kind", "status");
CREATE UNIQUE INDEX "delivery_base_profile_versions_one_published"
  ON "delivery_base_profile_versions"("profile_key")
  WHERE "status" = 'PUBLISHED';

CREATE TABLE "delivery_base_profile_role_units" (
    "id" TEXT NOT NULL,
    "base_profile_version_id" TEXT NOT NULL,
    "role_key" "DeliveryCompensationRoleKeyEnum" NOT NULL,
    "unit_kind" "DeliveryRoleUnitKindEnum" NOT NULL,
    "units" DECIMAL(14, 4),

    CONSTRAINT "delivery_base_profile_role_units_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_base_profile_role_units_kind_units_chk" CHECK (
      ("unit_kind" = 'NOT_REQUIRED' AND "units" IS NULL)
      OR ("unit_kind" = 'REQUIRED')
    )
);

CREATE UNIQUE INDEX "delivery_base_profile_role_units_base_profile_version_id_role_key_key"
  ON "delivery_base_profile_role_units"("base_profile_version_id", "role_key");

CREATE TABLE "delivery_base_included_functions" (
    "id" TEXT NOT NULL,
    "base_profile_version_id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,

    CONSTRAINT "delivery_base_included_functions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_base_included_functions_base_profile_version_id_function_id_key"
  ON "delivery_base_included_functions"("base_profile_version_id", "function_id");
CREATE INDEX "delivery_base_included_functions_function_id_idx"
  ON "delivery_base_included_functions"("function_id");

CREATE TABLE "delivery_role_rate_versions" (
    "id" TEXT NOT NULL,
    "role_key" "DeliveryCompensationRoleKeyEnum" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "rate" DECIMAL(14, 4) NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DeliveryNormativeStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "published_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_role_rate_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_role_rate_versions_rate_nonneg_chk" CHECK ("rate" >= 0)
);

CREATE UNIQUE INDEX "delivery_role_rate_versions_role_key_version_key"
  ON "delivery_role_rate_versions"("role_key", "version");
CREATE INDEX "delivery_role_rate_versions_role_key_status_idx"
  ON "delivery_role_rate_versions"("role_key", "status");
CREATE UNIQUE INDEX "delivery_role_rate_versions_one_published"
  ON "delivery_role_rate_versions"("role_key")
  WHERE "status" = 'PUBLISHED';

-- ── plan ───────────────────────────────────────────────────

CREATE TABLE "delivery_compensation_runtime_settings" (
    "id" TEXT NOT NULL,
    "new_enrollment_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_compensation_runtime_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "delivery_compensation_runtime_settings" ("id", "new_enrollment_enabled", "updated_at")
VALUES ('default', false, CURRENT_TIMESTAMP);

CREATE TABLE "delivery_configurations" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "extension_id" TEXT,
    "entity_kind" "DeliveryEntityKindEnum" NOT NULL,
    "mode" "DeliveryConfigurationModeEnum" NOT NULL DEFAULT 'LEGACY',
    "model_version" TEXT NOT NULL DEFAULT '2',
    "current_revision_id" TEXT,
    "initial_revision_id" TEXT,
    "base_profile_version_id" TEXT,
    "product_type" "ProductTypeEnum",
    "product_category" "ProductCategoryEnum",
    "config_size" "DeliveryConfigSizeEnum",
    "implementation_base" "DeliveryImplementationBaseEnum",
    "design_mode" "DeliveryDesignModeEnum",
    "ai_designer_review" BOOLEAN NOT NULL DEFAULT false,
    "checked_by_id" TEXT,
    "checked_at" TIMESTAMP(3),
    "draft_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_configurations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_configurations_owner_xor_chk" CHECK (
      (
        "entity_kind" = 'PRODUCT'
        AND "product_id" IS NOT NULL
        AND "extension_id" IS NULL
      )
      OR (
        "entity_kind" = 'EXTENSION'
        AND "extension_id" IS NOT NULL
        AND "product_id" IS NULL
      )
    )
);

CREATE UNIQUE INDEX "delivery_configurations_order_id_key" ON "delivery_configurations"("order_id");
CREATE UNIQUE INDEX "delivery_configurations_current_revision_id_key"
  ON "delivery_configurations"("current_revision_id");
CREATE UNIQUE INDEX "delivery_configurations_initial_revision_id_key"
  ON "delivery_configurations"("initial_revision_id");
CREATE INDEX "delivery_configurations_product_id_idx" ON "delivery_configurations"("product_id");
CREATE INDEX "delivery_configurations_extension_id_idx" ON "delivery_configurations"("extension_id");
CREATE INDEX "delivery_configurations_mode_idx" ON "delivery_configurations"("mode");

CREATE TABLE "delivery_configuration_features" (
    "id" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "function_id" TEXT NOT NULL,
    "selected_price_version_id" TEXT,
    "origin" "DeliveryFeatureOriginEnum" NOT NULL,
    "local_note" TEXT,
    "work_state" "DeliveryFeatureWorkStateEnum" NOT NULL DEFAULT 'NOT_STARTED',
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_configuration_features_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "delivery_configuration_features_configuration_id_idx"
  ON "delivery_configuration_features"("configuration_id");
CREATE INDEX "delivery_configuration_features_function_id_idx"
  ON "delivery_configuration_features"("function_id");
CREATE UNIQUE INDEX "delivery_configuration_features_active_unique"
  ON "delivery_configuration_features"("configuration_id", "function_id")
  WHERE "archived_at" IS NULL;

CREATE TABLE "delivery_configuration_revisions" (
    "id" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "reason" TEXT,
    "actor_id" TEXT NOT NULL,
    "scope_snapshot" JSONB NOT NULL,
    "team_snapshot" JSONB NOT NULL,
    "financial_effective_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_configuration_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_configuration_revisions_configuration_id_sequence_key"
  ON "delivery_configuration_revisions"("configuration_id", "sequence");
CREATE INDEX "delivery_configuration_revisions_configuration_id_idx"
  ON "delivery_configuration_revisions"("configuration_id");

CREATE TABLE "delivery_bonus_components" (
    "id" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "feature_id" TEXT,
    "component_key" TEXT NOT NULL,
    "kind" "DeliveryBonusComponentKindEnum" NOT NULL,
    "role_key" "DeliveryCompensationRoleKeyEnum" NOT NULL,
    "units_snapshot" DECIMAL(14, 4) NOT NULL,
    "rate_snapshot" DECIMAL(14, 4) NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "originating_revision_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_bonus_components_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_bonus_components_kind_feature_chk" CHECK (
      ("kind" = 'BASE' AND "feature_id" IS NULL)
      OR ("kind" = 'FEATURE' AND "feature_id" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "delivery_bonus_components_configuration_id_component_key_role_key_key"
  ON "delivery_bonus_components"("configuration_id", "component_key", "role_key");
CREATE INDEX "delivery_bonus_components_configuration_id_idx"
  ON "delivery_bonus_components"("configuration_id");

CREATE TABLE "delivery_bonus_allocations" (
    "id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "share_percent" DECIMAL(5, 2) NOT NULL,
    "retained_accepted_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "current_planned_amount" DECIMAL(12, 2) NOT NULL,
    "originating_revision_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_bonus_allocations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_bonus_allocations_share_chk" CHECK (
      "share_percent" >= 0 AND "share_percent" <= 100
    )
);

CREATE INDEX "delivery_bonus_allocations_component_id_idx" ON "delivery_bonus_allocations"("component_id");
CREATE INDEX "delivery_bonus_allocations_employee_id_idx" ON "delivery_bonus_allocations"("employee_id");

CREATE TABLE "extension_delivery_role_assignments" (
    "id" TEXT NOT NULL,
    "extension_id" TEXT NOT NULL,
    "role_key" "DeliveryCompensationRoleKeyEnum" NOT NULL,
    "employee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extension_delivery_role_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "extension_delivery_role_assignments_extension_id_role_key_key"
  ON "extension_delivery_role_assignments"("extension_id", "role_key");
CREATE INDEX "extension_delivery_role_assignments_employee_id_idx"
  ON "extension_delivery_role_assignments"("employee_id");

-- ── BonusEntry additive anchors (nullable; legacy rows stay null) ──

ALTER TABLE "bonus_entries"
  ADD COLUMN "delivery_source" "DeliveryBonusSourceEnum",
  ADD COLUMN "delivery_allocation_id" TEXT,
  ADD COLUMN "delivery_role_key" "DeliveryCompensationRoleKeyEnum",
  ADD COLUMN "delivery_configuration_id" TEXT,
  ADD COLUMN "delivery_component_id" TEXT,
  ADD COLUMN "delivery_revision_id" TEXT,
  ADD COLUMN "delivery_normative_snapshot" JSONB;

CREATE UNIQUE INDEX "bonus_entries_delivery_allocation_id_key"
  ON "bonus_entries"("delivery_allocation_id");
CREATE INDEX "bonus_entries_delivery_configuration_id_idx"
  ON "bonus_entries"("delivery_configuration_id");
CREATE INDEX "bonus_entries_delivery_source_idx"
  ON "bonus_entries"("delivery_source");

-- ── foreign keys ───────────────────────────────────────────

ALTER TABLE "delivery_functions"
  ADD CONSTRAINT "delivery_functions_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_function_content_versions"
  ADD CONSTRAINT "delivery_function_content_versions_function_id_fkey"
  FOREIGN KEY ("function_id") REFERENCES "delivery_functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_function_content_versions"
  ADD CONSTRAINT "delivery_function_content_versions_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_function_attachments"
  ADD CONSTRAINT "delivery_function_attachments_content_version_id_fkey"
  FOREIGN KEY ("content_version_id") REFERENCES "delivery_function_content_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_function_attachments"
  ADD CONSTRAINT "delivery_function_attachments_file_asset_id_fkey"
  FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_function_price_versions"
  ADD CONSTRAINT "delivery_function_price_versions_function_id_fkey"
  FOREIGN KEY ("function_id") REFERENCES "delivery_functions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_function_price_versions"
  ADD CONSTRAINT "delivery_function_price_versions_published_by_id_fkey"
  FOREIGN KEY ("published_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "delivery_function_price_role_units"
  ADD CONSTRAINT "delivery_function_price_role_units_price_version_id_fkey"
  FOREIGN KEY ("price_version_id") REFERENCES "delivery_function_price_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_base_profile_versions"
  ADD CONSTRAINT "delivery_base_profile_versions_published_by_id_fkey"
  FOREIGN KEY ("published_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "delivery_base_profile_role_units"
  ADD CONSTRAINT "delivery_base_profile_role_units_base_profile_version_id_fkey"
  FOREIGN KEY ("base_profile_version_id") REFERENCES "delivery_base_profile_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_base_included_functions"
  ADD CONSTRAINT "delivery_base_included_functions_base_profile_version_id_fkey"
  FOREIGN KEY ("base_profile_version_id") REFERENCES "delivery_base_profile_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_base_included_functions"
  ADD CONSTRAINT "delivery_base_included_functions_function_id_fkey"
  FOREIGN KEY ("function_id") REFERENCES "delivery_functions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_role_rate_versions"
  ADD CONSTRAINT "delivery_role_rate_versions_published_by_id_fkey"
  FOREIGN KEY ("published_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_extension_id_fkey"
  FOREIGN KEY ("extension_id") REFERENCES "extensions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_base_profile_version_id_fkey"
  FOREIGN KEY ("base_profile_version_id") REFERENCES "delivery_base_profile_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_checked_by_id_fkey"
  FOREIGN KEY ("checked_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "delivery_configuration_features"
  ADD CONSTRAINT "delivery_configuration_features_configuration_id_fkey"
  FOREIGN KEY ("configuration_id") REFERENCES "delivery_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_configuration_features"
  ADD CONSTRAINT "delivery_configuration_features_function_id_fkey"
  FOREIGN KEY ("function_id") REFERENCES "delivery_functions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_configuration_features"
  ADD CONSTRAINT "delivery_configuration_features_selected_price_version_id_fkey"
  FOREIGN KEY ("selected_price_version_id") REFERENCES "delivery_function_price_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_configuration_revisions"
  ADD CONSTRAINT "delivery_configuration_revisions_configuration_id_fkey"
  FOREIGN KEY ("configuration_id") REFERENCES "delivery_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_configuration_revisions"
  ADD CONSTRAINT "delivery_configuration_revisions_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_current_revision_id_fkey"
  FOREIGN KEY ("current_revision_id") REFERENCES "delivery_configuration_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delivery_configurations"
  ADD CONSTRAINT "delivery_configurations_initial_revision_id_fkey"
  FOREIGN KEY ("initial_revision_id") REFERENCES "delivery_configuration_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "delivery_bonus_components"
  ADD CONSTRAINT "delivery_bonus_components_configuration_id_fkey"
  FOREIGN KEY ("configuration_id") REFERENCES "delivery_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_bonus_components"
  ADD CONSTRAINT "delivery_bonus_components_feature_id_fkey"
  FOREIGN KEY ("feature_id") REFERENCES "delivery_configuration_features"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delivery_bonus_components"
  ADD CONSTRAINT "delivery_bonus_components_originating_revision_id_fkey"
  FOREIGN KEY ("originating_revision_id") REFERENCES "delivery_configuration_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_bonus_allocations"
  ADD CONSTRAINT "delivery_bonus_allocations_component_id_fkey"
  FOREIGN KEY ("component_id") REFERENCES "delivery_bonus_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_bonus_allocations"
  ADD CONSTRAINT "delivery_bonus_allocations_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_bonus_allocations"
  ADD CONSTRAINT "delivery_bonus_allocations_originating_revision_id_fkey"
  FOREIGN KEY ("originating_revision_id") REFERENCES "delivery_configuration_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "extension_delivery_role_assignments"
  ADD CONSTRAINT "extension_delivery_role_assignments_extension_id_fkey"
  FOREIGN KEY ("extension_id") REFERENCES "extensions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "extension_delivery_role_assignments"
  ADD CONSTRAINT "extension_delivery_role_assignments_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bonus_entries"
  ADD CONSTRAINT "bonus_entries_delivery_allocation_id_fkey"
  FOREIGN KEY ("delivery_allocation_id") REFERENCES "delivery_bonus_allocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bonus_entries"
  ADD CONSTRAINT "bonus_entries_delivery_configuration_id_fkey"
  FOREIGN KEY ("delivery_configuration_id") REFERENCES "delivery_configurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bonus_entries"
  ADD CONSTRAINT "bonus_entries_delivery_component_id_fkey"
  FOREIGN KEY ("delivery_component_id") REFERENCES "delivery_bonus_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bonus_entries"
  ADD CONSTRAINT "bonus_entries_delivery_revision_id_fkey"
  FOREIGN KEY ("delivery_revision_id") REFERENCES "delivery_configuration_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── app_user DML (runtime role; skip if role is absent) ──

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON
      "delivery_functions",
      "delivery_function_content_versions",
      "delivery_function_attachments",
      "delivery_function_price_versions",
      "delivery_function_price_role_units",
      "delivery_base_profile_versions",
      "delivery_base_profile_role_units",
      "delivery_base_included_functions",
      "delivery_role_rate_versions",
      "delivery_compensation_runtime_settings",
      "delivery_configurations",
      "delivery_configuration_features",
      "delivery_configuration_revisions",
      "delivery_bonus_components",
      "delivery_bonus_allocations",
      "extension_delivery_role_assignments"
    TO app_user;
  END IF;
END
$$;

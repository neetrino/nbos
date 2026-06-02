-- Platform Access Foundation (Phase 1)

CREATE TYPE "PlatformAccessActionEnum" AS ENUM ('VIEW', 'EDIT');
CREATE TYPE "PlatformResourceFamilyEnum" AS ENUM ('CREDENTIALS', 'DRIVE', 'FINANCE', 'PROJECT_HUB', 'TASKS');
CREATE TYPE "AccessScopeModeEnum" AS ENUM ('NONE', 'ALL', 'ASSIGNED');
CREATE TYPE "ProjectTeamRoleEnum" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "ProductTeamSlotEnum" AS ENUM ('PM', 'DEVELOPER', 'DESIGNER', 'TECHNICAL_SPECIALIST', 'QA_LEAD', 'CONTRIBUTOR');
CREATE TYPE "TeamMemberSourceEnum" AS ENUM ('MANUAL', 'PRODUCT_SLOT', 'EXTENSION_ASSIGNEE', 'MIGRATION');

CREATE TABLE "project_team_members" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role" "ProjectTeamRoleEnum" NOT NULL DEFAULT 'MEMBER',
    "access_level" "PlatformAccessActionEnum" NOT NULL DEFAULT 'VIEW',
    "source" "TeamMemberSourceEnum" NOT NULL DEFAULT 'MANUAL',
    "added_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_team_members" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "slot" "ProductTeamSlotEnum",
    "access_level" "PlatformAccessActionEnum" NOT NULL DEFAULT 'VIEW',
    "source" "TeamMemberSourceEnum" NOT NULL DEFAULT 'MANUAL',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "added_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_access_policies" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "resource_family" "PlatformResourceFamilyEnum" NOT NULL,
    "default_level" "PlatformAccessActionEnum" NOT NULL DEFAULT 'VIEW',
    "scope_mode" "AccessScopeModeEnum" NOT NULL DEFAULT 'ASSIGNED',
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_access_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_access_overrides" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "resource_family" "PlatformResourceFamilyEnum" NOT NULL,
    "level" "PlatformAccessActionEnum" NOT NULL DEFAULT 'VIEW',
    "scope_mode" "AccessScopeModeEnum",
    "reason" TEXT,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_access_overrides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "resource_access_grants" (
    "id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "level" "PlatformAccessActionEnum" NOT NULL,
    "granted_by_id" TEXT NOT NULL,
    "reason" TEXT,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_access_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_team_members_project_id_employee_id_key" ON "project_team_members"("project_id", "employee_id");
CREATE INDEX "project_team_members_employee_id_idx" ON "project_team_members"("employee_id");

CREATE UNIQUE INDEX "product_team_members_product_id_employee_id_key" ON "product_team_members"("product_id", "employee_id");
CREATE INDEX "product_team_members_employee_id_idx" ON "product_team_members"("employee_id");
CREATE INDEX "product_team_members_product_id_slot_idx" ON "product_team_members"("product_id", "slot");

CREATE UNIQUE INDEX "role_access_policies_role_id_resource_family_key" ON "role_access_policies"("role_id", "resource_family");

CREATE UNIQUE INDEX "employee_access_overrides_employee_id_resource_family_key" ON "employee_access_overrides"("employee_id", "resource_family");

CREATE UNIQUE INDEX "resource_access_grants_resource_type_resource_id_employee_id_key" ON "resource_access_grants"("resource_type", "resource_id", "employee_id");
CREATE INDEX "resource_access_grants_employee_id_idx" ON "resource_access_grants"("employee_id");
CREATE INDEX "resource_access_grants_resource_type_resource_id_idx" ON "resource_access_grants"("resource_type", "resource_id");

ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_team_members" ADD CONSTRAINT "product_team_members_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_team_members" ADD CONSTRAINT "product_team_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_team_members" ADD CONSTRAINT "product_team_members_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "role_access_policies" ADD CONSTRAINT "role_access_policies_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_access_policies" ADD CONSTRAINT "role_access_policies_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employee_access_overrides" ADD CONSTRAINT "employee_access_overrides_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_access_overrides" ADD CONSTRAINT "employee_access_overrides_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "resource_access_grants" ADD CONSTRAINT "resource_access_grants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_access_grants" ADD CONSTRAINT "resource_access_grants_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill product team from legacy Product slot FKs
INSERT INTO "product_team_members" ("id", "product_id", "employee_id", "slot", "access_level", "source", "is_primary", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p.id, p.pm_id, 'PM'::"ProductTeamSlotEnum", 'VIEW', 'MIGRATION', true, NOW(), NOW()
FROM "products" p WHERE p.pm_id IS NOT NULL
ON CONFLICT ("product_id", "employee_id") DO UPDATE SET
  "slot" = EXCLUDED."slot",
  "is_primary" = true,
  "source" = CASE WHEN "product_team_members"."source" = 'MANUAL' THEN "product_team_members"."source" ELSE 'MIGRATION' END,
  "updated_at" = NOW();

INSERT INTO "product_team_members" ("id", "product_id", "employee_id", "slot", "access_level", "source", "is_primary", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p.id, p.developer_id, 'DEVELOPER'::"ProductTeamSlotEnum", 'VIEW', 'MIGRATION', true, NOW(), NOW()
FROM "products" p WHERE p.developer_id IS NOT NULL
ON CONFLICT ("product_id", "employee_id") DO UPDATE SET
  "slot" = COALESCE("product_team_members"."slot", EXCLUDED."slot"),
  "is_primary" = ("product_team_members"."slot" IS NULL OR "product_team_members"."slot" = EXCLUDED."slot"),
  "updated_at" = NOW();

INSERT INTO "product_team_members" ("id", "product_id", "employee_id", "slot", "access_level", "source", "is_primary", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p.id, p.designer_id, 'DESIGNER'::"ProductTeamSlotEnum", 'VIEW', 'MIGRATION', true, NOW(), NOW()
FROM "products" p WHERE p.designer_id IS NOT NULL
ON CONFLICT ("product_id", "employee_id") DO UPDATE SET "updated_at" = NOW();

INSERT INTO "product_team_members" ("id", "product_id", "employee_id", "slot", "access_level", "source", "is_primary", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p.id, p.technical_specialist_id, 'TECHNICAL_SPECIALIST'::"ProductTeamSlotEnum", 'VIEW', 'MIGRATION', true, NOW(), NOW()
FROM "products" p WHERE p.technical_specialist_id IS NOT NULL
ON CONFLICT ("product_id", "employee_id") DO UPDATE SET "updated_at" = NOW();

INSERT INTO "product_team_members" ("id", "product_id", "employee_id", "slot", "access_level", "source", "is_primary", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p.id, p.qa_lead_id, 'QA_LEAD'::"ProductTeamSlotEnum", 'VIEW', 'MIGRATION', true, NOW(), NOW()
FROM "products" p WHERE p.qa_lead_id IS NOT NULL
ON CONFLICT ("product_id", "employee_id") DO UPDATE SET "updated_at" = NOW();

-- Extension assignees → product team contributor
INSERT INTO "product_team_members" ("id", "product_id", "employee_id", "slot", "access_level", "source", "is_primary", "created_at", "updated_at")
SELECT gen_random_uuid()::text, e.product_id, e.assigned_to, 'CONTRIBUTOR'::"ProductTeamSlotEnum", 'VIEW', 'MIGRATION', false, NOW(), NOW()
FROM "extensions" e WHERE e.assigned_to IS NOT NULL
ON CONFLICT ("product_id", "employee_id") DO NOTHING;

-- Project team: distinct employees from product team on that project
INSERT INTO "project_team_members" ("id", "project_id", "employee_id", "role", "access_level", "source", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p.project_id, ptm.employee_id, 'MEMBER', 'VIEW', 'MIGRATION', NOW(), NOW()
FROM "product_team_members" ptm
JOIN "products" p ON p.id = ptm.product_id
GROUP BY p.project_id, ptm.employee_id
ON CONFLICT ("project_id", "employee_id") DO NOTHING;

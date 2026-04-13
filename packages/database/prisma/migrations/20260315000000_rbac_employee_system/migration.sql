-- ============================================================
-- Migration: RBAC Employee System
-- Adds: Department, EmployeeDepartment (N:N), Role, Permission,
--       RolePermission, Invitation
-- Updates: Employee (role enum -> Role FK, department -> N:N),
--          Credential (ownerId, departmentId, PERSONAL)
-- ============================================================

-- ─── 1. ADD NEW ENUM VALUES ─────────────────────────────────

ALTER TYPE "CredentialAccessLevelEnum" ADD VALUE IF NOT EXISTS 'PERSONAL';
ALTER TYPE "CredentialCategoryEnum" ADD VALUE IF NOT EXISTS 'OTHER';

-- ─── 2. CREATE NEW TABLES ───────────────────────────────────

CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_slug_key" ON "departments"("slug");

CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

CREATE TABLE "employee_departments" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "dept_role" TEXT NOT NULL DEFAULT 'MEMBER',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_departments_employee_id_department_id_key" ON "employee_departments"("employee_id", "department_id");

CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "department_id" TEXT,
    "invited_by_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "employee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitations_email_key" ON "invitations"("email");
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");
CREATE UNIQUE INDEX "invitations_employee_id_key" ON "invitations"("employee_id");

-- ─── 3. SEED DEFAULT ROLES (needed for data migration) ──────

INSERT INTO "roles" ("id", "name", "slug", "level", "is_system") VALUES
  ('role-owner',           'Owner',            'owner',            1, true),
  ('role-ceo',             'CEO',              'ceo',              2, true),
  ('role-head-sales',      'Head of Sales',    'head-sales',       3, true),
  ('role-head-delivery',   'Head of Delivery', 'head-delivery',    3, true),
  ('role-finance-director','Finance Director', 'finance-director', 3, true),
  ('role-head-marketing',  'Head of Marketing','head-marketing',   3, true),
  ('role-seller',          'Seller',           'seller',           4, true),
  ('role-pm',              'Project Manager',  'pm',               4, true),
  ('role-developer',       'Developer',        'developer',        5, true),
  ('role-junior-developer','Junior Developer', 'junior-developer', 5, true),
  ('role-designer',        'Designer',         'designer',         5, true),
  ('role-qa',              'QA Engineer',       'qa',              5, true),
  ('role-tech-specialist', 'Tech Specialist',  'tech-specialist',  5, true),
  ('role-marketing',       'Marketing Specialist','marketing',     5, true),
  ('role-observer',        'Observer',         'observer',         6, true);

-- ─── 4. SEED DEFAULT DEPARTMENTS ────────────────────────────

INSERT INTO "departments" ("id", "name", "slug", "sort_order") VALUES
  ('dept-executive',  'Executive',   'executive',  0),
  ('dept-sales',      'Sales',       'sales',      1),
  ('dept-marketing',  'Marketing',   'marketing',  2),
  ('dept-delivery',   'Delivery',    'delivery',   3),
  ('dept-development','Development', 'development',4),
  ('dept-support',    'Support',     'support',    5),
  ('dept-finance',    'Finance',     'finance',    6),
  ('dept-hr',         'HR',          'hr',         7);

-- ─── 5. MIGRATE EMPLOYEE DATA ───────────────────────────────

-- Add new columns (role_id nullable initially for migration)
ALTER TABLE "employees" ADD COLUMN "role_id" TEXT;
ALTER TABLE "employees" ADD COLUMN "phone" TEXT;
ALTER TABLE "employees" ADD COLUMN "telegram" TEXT;
ALTER TABLE "employees" ADD COLUMN "avatar" TEXT;
ALTER TABLE "employees" ADD COLUMN "birthday" TIMESTAMP(3);
ALTER TABLE "employees" ADD COLUMN "notes" TEXT;
ALTER TABLE "employees" ADD COLUMN "position" TEXT;
ALTER TABLE "employees" ADD COLUMN "hire_date" TIMESTAMP(3);
ALTER TABLE "employees" ADD COLUMN "fire_date" TIMESTAMP(3);

-- Map old role enum -> new role_id
UPDATE "employees" SET "role_id" = 'role-ceo' WHERE "role" = 'CEO';
UPDATE "employees" SET "role_id" = 'role-seller' WHERE "role" = 'SELLER';
UPDATE "employees" SET "role_id" = 'role-pm' WHERE "role" = 'PM';
UPDATE "employees" SET "role_id" = 'role-developer' WHERE "role" = 'DEVELOPER';
UPDATE "employees" SET "role_id" = 'role-junior-developer' WHERE "role" = 'JUNIOR_DEVELOPER';
UPDATE "employees" SET "role_id" = 'role-designer' WHERE "role" = 'DESIGNER';
UPDATE "employees" SET "role_id" = 'role-qa' WHERE "role" = 'QA';
UPDATE "employees" SET "role_id" = 'role-tech-specialist' WHERE "role" = 'TECH_SPECIALIST';
UPDATE "employees" SET "role_id" = 'role-finance-director' WHERE "role" = 'FINANCE_DIRECTOR';
UPDATE "employees" SET "role_id" = 'role-marketing' WHERE "role" = 'MARKETING';
UPDATE "employees" SET "role_id" = 'role-head-sales' WHERE "role" = 'HEAD_SALES';
UPDATE "employees" SET "role_id" = 'role-head-delivery' WHERE "role" = 'HEAD_DELIVERY';

-- Fallback for any unmapped
UPDATE "employees" SET "role_id" = 'role-observer' WHERE "role_id" IS NULL;

-- Make role_id NOT NULL
ALTER TABLE "employees" ALTER COLUMN "role_id" SET NOT NULL;

-- Create EmployeeDepartment records from old department string
INSERT INTO "employee_departments" ("id", "employee_id", "department_id", "dept_role", "is_primary")
SELECT
  gen_random_uuid()::text,
  e."id",
  CASE
    WHEN e."department" ILIKE '%management%' OR e."department" ILIKE '%executive%' THEN 'dept-executive'
    WHEN e."department" ILIKE '%sales%' THEN 'dept-sales'
    WHEN e."department" ILIKE '%marketing%' THEN 'dept-marketing'
    WHEN e."department" ILIKE '%delivery%' THEN 'dept-delivery'
    WHEN e."department" ILIKE '%develop%' OR e."department" ILIKE '%engineering%' THEN 'dept-development'
    WHEN e."department" ILIKE '%support%' THEN 'dept-support'
    WHEN e."department" ILIKE '%finance%' THEN 'dept-finance'
    WHEN e."department" ILIKE '%hr%' THEN 'dept-hr'
    WHEN e."department" ILIKE '%design%' THEN 'dept-delivery'
    ELSE 'dept-executive'
  END,
  CASE
    WHEN e."role" IN ('CEO', 'HEAD_SALES', 'HEAD_DELIVERY', 'FINANCE_DIRECTOR') THEN 'HEAD'
    ELSE 'MEMBER'
  END,
  true
FROM "employees" e
WHERE e."department" IS NOT NULL;

-- Drop old columns
ALTER TABLE "employees" DROP COLUMN "role";
ALTER TABLE "employees" DROP COLUMN "department";

-- Update EmployeeStatusEnum: FIRED -> TERMINATED
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'FIRED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EmployeeStatusEnum')) THEN
    ALTER TYPE "EmployeeStatusEnum" RENAME VALUE 'FIRED' TO 'TERMINATED';
  END IF;
END $$;

-- Set default status to PROBATION
ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'PROBATION';

-- Drop old enum
DROP TYPE IF EXISTS "EmployeeRoleEnum";

-- ─── 6. UPDATE CREDENTIALS TABLE ────────────────────────────

ALTER TABLE "credentials" ADD COLUMN "department_id" TEXT;
ALTER TABLE "credentials" ADD COLUMN "owner_id" TEXT;
ALTER TABLE "credentials" ADD COLUMN "phone" TEXT;
ALTER TABLE "credentials" ADD COLUMN "notes" TEXT;

-- ─── 7. FOREIGN KEYS ────────────────────────────────────────

ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey"
  FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey"
  FOREIGN KEY ("invited_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "credentials" ADD CONSTRAINT "credentials_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "credentials" ADD CONSTRAINT "credentials_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

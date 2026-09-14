-- HIGH-risk authorization foundation. Expand-only: legacy employee.role_id and
-- employee_departments remain the runtime compatibility source during rollout.

CREATE TYPE "OrgSeatStatusEnum" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "OrgSeatKindEnum" AS ENUM ('HEAD', 'DEPUTY', 'STANDARD');
CREATE TYPE "OrgSeatAssignmentStatusEnum" AS ENUM ('ACTIVE', 'TEMPORARY', 'ENDED');
CREATE TYPE "PermissionRoleAssignmentSourceEnum" AS ENUM ('LEGACY', 'MANUAL', 'SEAT');

ALTER TABLE "departments" ADD COLUMN "head_seat_id" TEXT;
ALTER TABLE "employees" ADD COLUMN "access_version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "org_seats" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "default_permission_role_id" TEXT,
    "kind" "OrgSeatKindEnum" NOT NULL DEFAULT 'STANDARD',
    "status" "OrgSeatStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_seats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "org_seat_assignments" (
    "id" TEXT NOT NULL,
    "seat_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" "OrgSeatAssignmentStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "allocation_pct" INTEGER NOT NULL DEFAULT 100,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "membership_provisioned" BOOLEAN NOT NULL DEFAULT false,
    "previous_primary_department_id" TEXT,
    "assigned_by_id" TEXT,
    "ended_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_seat_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "org_seat_assignments_allocation_pct_check"
      CHECK ("allocation_pct" BETWEEN 1 AND 100),
    CONSTRAINT "org_seat_assignments_dates_check"
      CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at")
);

CREATE TABLE "permission_role_assignments" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "source" "PermissionRoleAssignmentSourceEnum" NOT NULL,
    "seat_assignment_id" TEXT,
    "scope_department_id" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "assigned_by_id" TEXT,
    "revoked_by_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_role_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "permission_role_assignments_dates_check"
      CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from"),
    CONSTRAINT "permission_role_assignments_source_check"
      CHECK (
        ("source" = 'SEAT' AND "seat_assignment_id" IS NOT NULL)
        OR ("source" <> 'SEAT' AND "seat_assignment_id" IS NULL)
      )
);

CREATE UNIQUE INDEX "departments_head_seat_id_key"
  ON "departments"("head_seat_id");
CREATE INDEX "org_seats_department_id_status_sort_order_idx"
  ON "org_seats"("department_id", "status", "sort_order");
CREATE INDEX "org_seats_default_permission_role_id_idx"
  ON "org_seats"("default_permission_role_id");
CREATE INDEX "org_seat_assignments_seat_id_status_ends_at_idx"
  ON "org_seat_assignments"("seat_id", "status", "ends_at");
CREATE INDEX "org_seat_assignments_employee_id_status_ends_at_idx"
  ON "org_seat_assignments"("employee_id", "status", "ends_at");
CREATE UNIQUE INDEX "org_seat_assignments_one_active_per_seat"
  ON "org_seat_assignments"("seat_id")
  WHERE "status" IN ('ACTIVE', 'TEMPORARY') AND "ends_at" IS NULL;
CREATE UNIQUE INDEX "permission_role_assignments_seat_assignment_id_key"
  ON "permission_role_assignments"("seat_assignment_id");
CREATE INDEX "permission_role_assignments_employee_active_idx"
  ON "permission_role_assignments"("employee_id", "revoked_at", "effective_from", "effective_to");
CREATE INDEX "permission_role_assignments_role_id_idx"
  ON "permission_role_assignments"("role_id");
CREATE INDEX "permission_role_assignments_scope_department_id_idx"
  ON "permission_role_assignments"("scope_department_id");
CREATE UNIQUE INDEX "permission_role_assignments_one_active_legacy"
  ON "permission_role_assignments"("employee_id")
  WHERE "source" = 'LEGACY'
    AND "revoked_at" IS NULL;
CREATE UNIQUE INDEX "permission_role_assignments_one_active_manual_role"
  ON "permission_role_assignments"("employee_id", "role_id")
  WHERE "source" = 'MANUAL'
    AND "revoked_at" IS NULL;

ALTER TABLE "org_seats"
  ADD CONSTRAINT "org_seats_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_seats"
  ADD CONSTRAINT "org_seats_default_permission_role_id_fkey"
  FOREIGN KEY ("default_permission_role_id") REFERENCES "roles"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments"
  ADD CONSTRAINT "departments_head_seat_id_fkey"
  FOREIGN KEY ("head_seat_id") REFERENCES "org_seats"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "org_seat_assignments"
  ADD CONSTRAINT "org_seat_assignments_seat_id_fkey"
  FOREIGN KEY ("seat_id") REFERENCES "org_seats"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_seat_assignments"
  ADD CONSTRAINT "org_seat_assignments_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_seat_assignments"
  ADD CONSTRAINT "org_seat_assignments_assigned_by_id_fkey"
  FOREIGN KEY ("assigned_by_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "org_seat_assignments"
  ADD CONSTRAINT "org_seat_assignments_ended_by_id_fkey"
  FOREIGN KEY ("ended_by_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "permission_role_assignments"
  ADD CONSTRAINT "permission_role_assignments_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "permission_role_assignments"
  ADD CONSTRAINT "permission_role_assignments_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "permission_role_assignments"
  ADD CONSTRAINT "permission_role_assignments_seat_assignment_id_fkey"
  FOREIGN KEY ("seat_assignment_id") REFERENCES "org_seat_assignments"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "permission_role_assignments"
  ADD CONSTRAINT "permission_role_assignments_scope_department_id_fkey"
  FOREIGN KEY ("scope_department_id") REFERENCES "departments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "permission_role_assignments"
  ADD CONSTRAINT "permission_role_assignments_assigned_by_id_fkey"
  FOREIGN KEY ("assigned_by_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "permission_role_assignments"
  ADD CONSTRAINT "permission_role_assignments_revoked_by_id_fkey"
  FOREIGN KEY ("revoked_by_id") REFERENCES "employees"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve the exact current access baseline. IDs are deterministic because an
-- employee has exactly one legacy role and IDs are unique only within this table.
INSERT INTO "permission_role_assignments" (
    "id",
    "employee_id",
    "role_id",
    "source",
    "is_primary",
    "effective_from",
    "effective_to",
    "revoked_at",
    "reason",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "id",
    "role_id",
    'LEGACY'::"PermissionRoleAssignmentSourceEnum",
    true,
    "created_at",
    CASE
      WHEN "status" = 'TERMINATED'
        THEN GREATEST("created_at", COALESCE("fire_date", CURRENT_TIMESTAMP))
    END,
    CASE
      WHEN "status" = 'TERMINATED'
        THEN GREATEST("created_at", COALESCE("fire_date", CURRENT_TIMESTAMP))
    END,
    CASE
      WHEN "status" = 'TERMINATED' THEN 'Backfilled as revoked for terminated employee'
      ELSE 'Backfilled from employees.role_id'
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "employees";

-- Seats and department leadership require explicit business confirmation.
-- Never infer them from memberships, role names, positions or platform ownership.
CREATE UNIQUE INDEX "org_seat_assignments_one_open_primary_per_employee"
  ON "org_seat_assignments"("employee_id")
  WHERE "is_primary" = true
    AND "status" IN ('ACTIVE', 'TEMPORARY')
    AND "ends_at" IS NULL;

-- Existing environments may provision restricted runtime roles separately.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON
      "org_seats", "org_seat_assignments", "permission_role_assignments" TO app_user;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly_user') THEN
    GRANT SELECT ON
      "org_seats", "org_seat_assignments", "permission_role_assignments" TO readonly_user;
  END IF;
END $$;

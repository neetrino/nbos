CREATE TYPE "BonusReleaseTypeEnum" AS ENUM (
    'AUTO',
    'MANUAL',
    'EARLY',
    'EXTRA',
    'OVER_FUNDING',
    'CORRECTION'
);

CREATE TYPE "BonusReleaseStatusEnum" AS ENUM (
    'DRAFT',
    'APPROVED',
    'INCLUDED_IN_PAYROLL',
    'PAID',
    'CANCELLED'
);

CREATE TABLE "bonus_releases" (
    "id" TEXT NOT NULL,
    "bonus_entry_id" TEXT NOT NULL,
    "payroll_run_id" TEXT,
    "employee_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "product_id" TEXT,
    "extension_id" TEXT,
    "amount" DECIMAL(12, 2) NOT NULL,
    "release_type" "BonusReleaseTypeEnum" NOT NULL,
    "reason" TEXT,
    "approved_by_id" TEXT,
    "status" "BonusReleaseStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_releases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bonus_releases_bonus_entry_id_idx" ON "bonus_releases"("bonus_entry_id");

CREATE INDEX "bonus_releases_payroll_run_id_idx" ON "bonus_releases"("payroll_run_id");

CREATE INDEX "bonus_releases_project_id_idx" ON "bonus_releases"("project_id");

ALTER TABLE "bonus_releases"
ADD CONSTRAINT "bonus_releases_bonus_entry_id_fkey" FOREIGN KEY ("bonus_entry_id") REFERENCES "bonus_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bonus_releases"
ADD CONSTRAINT "bonus_releases_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bonus_releases"
ADD CONSTRAINT "bonus_releases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bonus_releases"
ADD CONSTRAINT "bonus_releases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bonus_releases"
ADD CONSTRAINT "bonus_releases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bonus_releases"
ADD CONSTRAINT "bonus_releases_extension_id_fkey" FOREIGN KEY ("extension_id") REFERENCES "extensions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bonus_releases"
ADD CONSTRAINT "bonus_releases_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "CompensationProfileStatusEnum" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "compensation_profiles" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "payout_schedule" JSONB,
    "bonus_policy_id" TEXT,
    "kpi_policy_id" TEXT,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "status" "CompensationProfileStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "source" TEXT,
    "notes" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_profiles_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "salary_lines" ADD COLUMN "compensation_profile_id" TEXT;

-- CreateIndex
CREATE INDEX "compensation_profiles_employee_id_status_idx" ON "compensation_profiles"("employee_id", "status");

-- CreateIndex
CREATE INDEX "compensation_profiles_employee_id_effective_from_idx" ON "compensation_profiles"("employee_id", "effective_from");

-- AddForeignKey
ALTER TABLE "compensation_profiles" ADD CONSTRAINT "compensation_profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation_profiles" ADD CONSTRAINT "compensation_profiles_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_lines" ADD CONSTRAINT "salary_lines_compensation_profile_id_fkey" FOREIGN KEY ("compensation_profile_id") REFERENCES "compensation_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill one ACTIVE profile per employee with legacy base_salary
INSERT INTO "compensation_profiles" (
    "id",
    "employee_id",
    "base_salary",
    "currency",
    "effective_from",
    "status",
    "source",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    e."id",
    COALESCE(e."base_salary", 0),
    'AMD',
    COALESCE(e."hire_date"::date, e."created_at"::date),
    'ACTIVE',
    'LEGACY_EMPLOYEE_BASE_SALARY',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "employees" e
WHERE e."status" <> 'TERMINATED'
  AND NOT EXISTS (
    SELECT 1 FROM "compensation_profiles" cp WHERE cp."employee_id" = e."id"
  );

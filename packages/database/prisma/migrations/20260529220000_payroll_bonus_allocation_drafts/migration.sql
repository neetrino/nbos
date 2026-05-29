CREATE TYPE "PayrollBonusAllocationKindEnum" AS ENUM (
    'READY',
    'PARTIALLY_FUNDED',
    'PROGRESS',
    'MANUAL_BONUS',
    'EXTRA_BONUS',
    'OVER_FUNDING'
);

CREATE TABLE "payroll_bonus_allocation_drafts" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "bonus_entry_id" TEXT,
    "amount" DECIMAL(12, 2) NOT NULL,
    "kind" "PayrollBonusAllocationKindEnum" NOT NULL,
    "title" TEXT,
    "reason" TEXT,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payroll_bonus_allocation_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payroll_bonus_allocation_drafts_payroll_run_id_employee_id_order_id_key"
ON "payroll_bonus_allocation_drafts"("payroll_run_id", "employee_id", "order_id");

CREATE INDEX "payroll_bonus_allocation_drafts_payroll_run_id_idx"
ON "payroll_bonus_allocation_drafts"("payroll_run_id");

CREATE INDEX "payroll_bonus_allocation_drafts_bonus_entry_id_idx"
ON "payroll_bonus_allocation_drafts"("bonus_entry_id");

ALTER TABLE "payroll_bonus_allocation_drafts"
ADD CONSTRAINT "payroll_bonus_allocation_drafts_payroll_run_id_fkey"
FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_bonus_allocation_drafts"
ADD CONSTRAINT "payroll_bonus_allocation_drafts_employee_id_fkey"
FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payroll_bonus_allocation_drafts"
ADD CONSTRAINT "payroll_bonus_allocation_drafts_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_bonus_allocation_drafts"
ADD CONSTRAINT "payroll_bonus_allocation_drafts_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_bonus_allocation_drafts"
ADD CONSTRAINT "payroll_bonus_allocation_drafts_bonus_entry_id_fkey"
FOREIGN KEY ("bonus_entry_id") REFERENCES "bonus_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_bonus_allocation_drafts"
ADD CONSTRAINT "payroll_bonus_allocation_drafts_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payroll_bonus_allocation_drafts"
ADD CONSTRAINT "payroll_bonus_allocation_drafts_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

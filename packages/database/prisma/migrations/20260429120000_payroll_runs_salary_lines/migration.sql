-- CreateEnum
CREATE TYPE "PayrollRunStatusEnum" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PAYING', 'CLOSED');

-- CreateEnum
CREATE TYPE "SalaryLineStatusEnum" AS ENUM ('PENDING', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'HELD');

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "payroll_month" VARCHAR(7) NOT NULL,
    "status" "PayrollRunStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "total_base_salary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_bonuses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_adjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_payable" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_lines" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonuses_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustments_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_payable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "SalaryLineStatusEnum" NOT NULL DEFAULT 'PENDING',
    "expense_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_payroll_month_key" ON "payroll_runs"("payroll_month");

-- CreateIndex
CREATE INDEX "salary_lines_payroll_run_id_idx" ON "salary_lines"("payroll_run_id");

-- CreateIndex
CREATE INDEX "salary_lines_employee_id_idx" ON "salary_lines"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "salary_lines_expense_id_key" ON "salary_lines"("expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "salary_lines_payroll_run_id_employee_id_key" ON "salary_lines"("payroll_run_id", "employee_id");

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_lines" ADD CONSTRAINT "salary_lines_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_lines" ADD CONSTRAINT "salary_lines_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_lines" ADD CONSTRAINT "salary_lines_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

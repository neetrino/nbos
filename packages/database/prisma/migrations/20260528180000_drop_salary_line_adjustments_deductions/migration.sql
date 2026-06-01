-- Remove unused payroll adjustment/deduction columns (totalPayable = base + bonuses only).

ALTER TABLE "salary_lines" DROP COLUMN IF EXISTS "adjustments_total";
ALTER TABLE "salary_lines" DROP COLUMN IF EXISTS "deductions_total";

ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "total_adjustments";
ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "total_deductions";

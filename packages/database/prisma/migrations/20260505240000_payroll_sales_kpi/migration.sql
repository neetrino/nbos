-- AlterTable
ALTER TABLE "payroll_runs" ADD COLUMN "kpi_sales_plan_amount" DECIMAL(14,2),
ADD COLUMN "kpi_sales_actual_amount" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "bonus_releases" ADD COLUMN "payroll_included_amount" DECIMAL(12,2);

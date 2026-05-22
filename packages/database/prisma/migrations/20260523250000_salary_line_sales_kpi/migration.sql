-- Per-employee sales KPI override for payroll attach (falls back to payroll_runs when null).
ALTER TABLE "salary_lines"
ADD COLUMN "kpi_sales_plan_amount" DECIMAL(14, 2),
ADD COLUMN "kpi_sales_actual_amount" DECIMAL(14, 2);

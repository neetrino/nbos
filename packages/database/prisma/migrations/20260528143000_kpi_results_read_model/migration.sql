CREATE TYPE "KpiResultSourceEnum" AS ENUM ('SYSTEM', 'MANUAL', 'IMPORT');

CREATE TABLE "kpi_results" (
  "id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "kpi_policy_id" TEXT,
  "compensation_profile_id" TEXT,
  "payroll_run_id" TEXT,
  "salary_line_id" TEXT,
  "period" VARCHAR(7) NOT NULL,
  "plan_amount" DECIMAL(14,2),
  "actual_amount" DECIMAL(14,2),
  "attainment_pct" DECIMAL(7,2),
  "payout_factor" DECIMAL(7,4) NOT NULL DEFAULT 1,
  "source" "KpiResultSourceEnum" NOT NULL DEFAULT 'SYSTEM',
  "source_facts" JSONB,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "kpi_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "kpi_results_employee_id_period_kpi_policy_id_key" ON "kpi_results"("employee_id", "period", "kpi_policy_id");
CREATE INDEX "kpi_results_period_idx" ON "kpi_results"("period");
CREATE INDEX "kpi_results_payroll_run_id_idx" ON "kpi_results"("payroll_run_id");
CREATE INDEX "kpi_results_salary_line_id_idx" ON "kpi_results"("salary_line_id");

ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_kpi_policy_id_fkey" FOREIGN KEY ("kpi_policy_id") REFERENCES "kpi_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_compensation_profile_id_fkey" FOREIGN KEY ("compensation_profile_id") REFERENCES "compensation_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_salary_line_id_fkey" FOREIGN KEY ("salary_line_id") REFERENCES "salary_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

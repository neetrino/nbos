-- Monthly bonus cap multiplier per KPI policy (base salary × multiplier).
ALTER TABLE "kpi_policies"
ADD COLUMN "bonus_cap_base_salary_multiplier" DECIMAL(4, 2) NOT NULL DEFAULT 2;

UPDATE "kpi_policies"
SET "bonus_cap_base_salary_multiplier" = 2
WHERE "bonus_cap_base_salary_multiplier" IS NULL;

-- Persist SALES KPI reduction at payroll attach (NBOS § Policy Engine — burned KPI MVP).
ALTER TABLE "bonus_releases"
ADD COLUMN "kpi_burned_amount" DECIMAL(12, 2);

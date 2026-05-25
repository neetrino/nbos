ALTER TABLE "kpi_policies"
ADD COLUMN "scorecard_metrics" JSONB NOT NULL DEFAULT '[]';

UPDATE "kpi_policies"
SET "scorecard_metrics" = '[
  {"code":"DEALS_CLOSED","label":"Deals closed","period":"MONTH","description":"Successfully closed deals in the period"},
  {"code":"REVENUE_GENERATED","label":"Revenue generated","period":"MONTH","description":"Paid invoice total used as sales KPI actual at payroll attach","payrollField":"kpiSalesActualAmount"},
  {"code":"REVENUE_TARGET","label":"Revenue target","period":"MONTH","description":"Monthly sales plan on payroll run or per employee","payrollField":"kpiSalesPlanAmount"},
  {"code":"CONVERSION_RATE","label":"Conversion rate","period":"MONTH","description":"SQL to Deal Won (personal)"}
]'::jsonb
WHERE "id" IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002'
);

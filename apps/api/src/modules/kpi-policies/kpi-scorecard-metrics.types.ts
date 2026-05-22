/** Period label for scorecard metrics (NBOS My Company § KPI Scorecard). */
export const KPI_SCORECARD_PERIODS = ['WEEK', 'MONTH', 'QUARTER', 'SPRINT'] as const;

export type KpiScorecardPeriod = (typeof KPI_SCORECARD_PERIODS)[number];

/** Optional link from a metric to payroll run sales KPI inputs at attach. */
export type KpiScorecardPayrollField = 'kpiSalesPlanAmount' | 'kpiSalesActualAmount';

export type KpiScorecardMetric = {
  code: string;
  label: string;
  period: KpiScorecardPeriod;
  description?: string;
  payrollField?: KpiScorecardPayrollField;
};

export const DEFAULT_SALES_SCORECARD_METRICS: KpiScorecardMetric[] = [
  {
    code: 'DEALS_CLOSED',
    label: 'Deals closed',
    period: 'MONTH',
    description: 'Successfully closed deals in the period',
  },
  {
    code: 'REVENUE_GENERATED',
    label: 'Revenue generated',
    period: 'MONTH',
    description: 'Paid invoice total used as sales KPI actual at payroll attach',
    payrollField: 'kpiSalesActualAmount',
  },
  {
    code: 'REVENUE_TARGET',
    label: 'Revenue target',
    period: 'MONTH',
    description: 'Monthly sales plan entered on the payroll run or per employee',
    payrollField: 'kpiSalesPlanAmount',
  },
  {
    code: 'CONVERSION_RATE',
    label: 'Conversion rate',
    period: 'MONTH',
    description: 'SQL to Deal Won (personal)',
  },
];

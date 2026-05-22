'use client';

import { DetailSheetSection } from '@/components/shared';
import { buildSalesKpiGateSummary } from '@/features/finance/utils/sales-kpi-gate-summary';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

export function EmployeeMonthCompensationKpiSection({ detail }: { detail: SalaryLineMonthDetail }) {
  const summary = buildSalesKpiGateSummary(
    detail.payrollRun.kpiSalesPlanAmount,
    detail.payrollRun.kpiSalesActualAmount,
  );
  if (!summary) {
    return null;
  }

  return (
    <DetailSheetSection title="Sales KPI (run gate)">
      <p className="text-muted-foreground text-sm leading-snug">{summary}</p>
      <p className="text-muted-foreground mt-2 text-xs">
        Cap, carry-over, and per-entry KPI flags on bonus rows are policy-engine follow-ups; this
        month shows run-level gate only when plan/actual are recorded.
      </p>
    </DetailSheetSection>
  );
}

import { BadRequestException } from '@nestjs/common';
import { Decimal, type TransactionClient } from '@nbos/database';

import type { CompensationPayrollPolicy } from '../compensation-profiles/resolve-compensation-payroll-policy';
import type { KpiGateRules } from './kpi-gate-rules.types';
import { resolveSalesKpiPayoutFactorOrHold } from './sales-kpi-payroll-payout';

export type SalesKpiAmountSnapshot = {
  kpiSalesPlanAmount: Decimal | null;
  kpiSalesActualAmount: Decimal | null;
};

export type EmployeeSalesKpiSource = 'RUN_DEFAULT' | 'LINE_OVERRIDE';

export type ResolvedEmployeeSalesKpi = SalesKpiAmountSnapshot & {
  source: EmployeeSalesKpiSource;
};

type LineKpiFields = {
  kpiSalesPlanAmount: Decimal | null;
  kpiSalesActualAmount: Decimal | null;
};

/** Line fields win when either is set; missing side falls back to run. */
export function resolveEmployeeSalesKpi(
  line: LineKpiFields,
  run: SalesKpiAmountSnapshot,
): ResolvedEmployeeSalesKpi {
  const lineHasOverride = line.kpiSalesPlanAmount != null || line.kpiSalesActualAmount != null;
  if (!lineHasOverride) {
    return {
      kpiSalesPlanAmount: run.kpiSalesPlanAmount,
      kpiSalesActualAmount: run.kpiSalesActualAmount,
      source: 'RUN_DEFAULT',
    };
  }
  return {
    kpiSalesPlanAmount: line.kpiSalesPlanAmount ?? run.kpiSalesPlanAmount,
    kpiSalesActualAmount: line.kpiSalesActualAmount ?? run.kpiSalesActualAmount,
    source: 'LINE_OVERRIDE',
  };
}

export function assertEmployeeSalesKpiComplete(snapshot: SalesKpiAmountSnapshot): void {
  const plan = snapshot.kpiSalesPlanAmount;
  const actual = snapshot.kpiSalesActualAmount;
  const anySet = plan != null || actual != null;
  if (!anySet) {
    return;
  }
  if (plan == null || actual == null) {
    throw new BadRequestException(
      'Sales KPI requires both plan and actual (set on the salary line or payroll run, or clear both).',
    );
  }
  if (plan.lte(0)) {
    throw new BadRequestException('Sales KPI plan must be positive when KPI amounts are set.');
  }
}

export function salesKpiPayoutFactorFromSnapshot(
  snapshot: SalesKpiAmountSnapshot,
  gateRules: KpiGateRules,
): Decimal | null {
  return resolveSalesKpiPayoutFactorOrHold(
    snapshot.kpiSalesPlanAmount,
    snapshot.kpiSalesActualAmount,
    gateRules,
  );
}

type AttachKpiTx = Pick<TransactionClient, 'salaryLine'>;

export async function assertSalesKpiForAttachEmployees(
  tx: AttachKpiTx,
  payrollRunId: string,
  releases: Array<{ employeeId: string; bonusEntry: { type: string } }>,
  runKpi: SalesKpiAmountSnapshot,
): Promise<void> {
  const salesEmployeeIds = [
    ...new Set(releases.filter((r) => r.bonusEntry.type === 'SALES').map((r) => r.employeeId)),
  ];
  for (const employeeId of salesEmployeeIds) {
    const line = await tx.salaryLine.findUnique({
      where: { payrollRunId_employeeId: { payrollRunId, employeeId } },
      select: { kpiSalesPlanAmount: true, kpiSalesActualAmount: true },
    });
    const resolved = resolveEmployeeSalesKpi(
      line ?? { kpiSalesPlanAmount: null, kpiSalesActualAmount: null },
      runKpi,
    );
    assertEmployeeSalesKpiComplete(resolved);
  }
}

export function resolveSalesKpiFactorForEmployee(params: {
  employeeId: string;
  bonusType: string;
  line: LineKpiFields;
  runKpiSnapshot: SalesKpiAmountSnapshot;
  payrollPolicy: CompensationPayrollPolicy;
  cache: Map<string, Decimal | null>;
}): Decimal | null {
  if (params.bonusType !== 'SALES') {
    return new Decimal(1);
  }
  if (params.cache.has(params.employeeId)) {
    return params.cache.get(params.employeeId) ?? null;
  }
  const resolved = resolveEmployeeSalesKpi(params.line, params.runKpiSnapshot);
  const factor = salesKpiPayoutFactorFromSnapshot(resolved, params.payrollPolicy.gateRules);
  params.cache.set(params.employeeId, factor);
  return factor;
}

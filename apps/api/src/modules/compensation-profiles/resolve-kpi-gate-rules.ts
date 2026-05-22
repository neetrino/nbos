import type { TransactionClient } from '@nbos/database';

import { DEFAULT_KPI_GATE_RULES } from '../payroll-runs/default-kpi-gate-rules';
import { parseKpiGateRules } from '../payroll-runs/parse-kpi-gate-rules';
import type { KpiGateRules } from '../payroll-runs/kpi-gate-rules.types';
import { resolveCompensationProfileForPayrollMonth } from './resolve-active-compensation-profile';

export type KpiGateRulesDb = Pick<TransactionClient, 'compensationProfile' | 'kpiPolicy'>;

/**
 * Active compensation profile → KPI policy gate bands, else platform default.
 */
export async function resolveKpiGateRulesForPayrollEmployee(
  db: KpiGateRulesDb,
  employeeId: string,
  payrollMonth: string,
): Promise<KpiGateRules> {
  const profile = await resolveCompensationProfileForPayrollMonth(db, employeeId, payrollMonth);
  if (profile?.kpiPolicyId == null) {
    return DEFAULT_KPI_GATE_RULES;
  }

  const policy = await db.kpiPolicy.findFirst({
    where: { id: profile.kpiPolicyId, status: 'ACTIVE' },
    select: { gateRules: true },
  });
  if (policy == null) {
    return DEFAULT_KPI_GATE_RULES;
  }

  return parseKpiGateRules(policy.gateRules);
}

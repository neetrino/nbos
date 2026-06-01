import type { TransactionClient } from '@nbos/database';
import { Decimal } from '@nbos/database';

import { DEFAULT_KPI_GATE_RULES } from '../payroll-runs/default-kpi-gate-rules';
import { parseBonusCapBaseSalaryMultiplier } from '../payroll-runs/parse-bonus-cap-multiplier';
import { parseKpiGateRules } from '../payroll-runs/parse-kpi-gate-rules';
import type { KpiGateRules } from '../payroll-runs/kpi-gate-rules.types';
import { resolveCompensationProfileForPayrollMonth } from './resolve-active-compensation-profile';

export type CompensationPayrollPolicyDb = Pick<
  TransactionClient,
  'compensationProfile' | 'kpiPolicy'
>;

export type CompensationPayrollPolicy = {
  kpiPolicyId: string | null;
  gateRules: KpiGateRules;
  bonusCapBaseSalaryMultiplier: Decimal;
};

const DEFAULT_POLICY: CompensationPayrollPolicy = {
  kpiPolicyId: null,
  gateRules: DEFAULT_KPI_GATE_RULES,
  bonusCapBaseSalaryMultiplier: parseBonusCapBaseSalaryMultiplier(null),
};

/**
 * Active compensation profile → KPI gate bands + monthly bonus cap multiplier.
 */
export async function resolveCompensationPayrollPolicyForEmployee(
  db: CompensationPayrollPolicyDb,
  employeeId: string,
  payrollMonth: string,
): Promise<CompensationPayrollPolicy> {
  const profile = await resolveCompensationProfileForPayrollMonth(db, employeeId, payrollMonth);
  if (profile?.kpiPolicyId == null) {
    return DEFAULT_POLICY;
  }

  const policy = await db.kpiPolicy.findFirst({
    where: { id: profile.kpiPolicyId, status: 'ACTIVE' },
    select: { gateRules: true, bonusCapBaseSalaryMultiplier: true },
  });
  if (policy == null) {
    return DEFAULT_POLICY;
  }

  return {
    kpiPolicyId: profile.kpiPolicyId,
    gateRules: parseKpiGateRules(policy.gateRules),
    bonusCapBaseSalaryMultiplier: parseBonusCapBaseSalaryMultiplier(
      policy.bonusCapBaseSalaryMultiplier,
    ),
  };
}

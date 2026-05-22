import type { KpiGateRules } from '../payroll-runs/kpi-gate-rules.types';
import {
  resolveCompensationPayrollPolicyForEmployee,
  type CompensationPayrollPolicyDb,
} from './resolve-compensation-payroll-policy';

export type KpiGateRulesDb = CompensationPayrollPolicyDb;

/** @deprecated Use `resolveCompensationPayrollPolicyForEmployee` for gate + cap. */
export async function resolveKpiGateRulesForPayrollEmployee(
  db: KpiGateRulesDb,
  employeeId: string,
  payrollMonth: string,
): Promise<KpiGateRules> {
  const policy = await resolveCompensationPayrollPolicyForEmployee(db, employeeId, payrollMonth);
  return policy.gateRules;
}

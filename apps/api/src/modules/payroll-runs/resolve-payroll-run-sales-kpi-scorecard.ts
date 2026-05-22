import type { PrismaClient } from '@nbos/database';

import { DEFAULT_KPI_POLICY_ID } from '../compensation-profiles/default-kpi-policy-id';
import { resolveCompensationProfileForPayrollMonth } from '../compensation-profiles/resolve-active-compensation-profile';
import { parseKpiScorecardMetrics } from '../kpi-policies/parse-kpi-scorecard-metrics';
import type { KpiScorecardMetric } from '../kpi-policies/kpi-scorecard-metrics.types';

type ResolveDb = Pick<PrismaClient, 'compensationProfile' | 'kpiPolicy'>;

function pickDominantKpiPolicyId(policyIds: string[]): string {
  const counts = new Map<string, number>();
  for (const id of policyIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let chosen = DEFAULT_KPI_POLICY_ID;
  let max = 0;
  for (const [id, n] of counts) {
    if (n > max) {
      max = n;
      chosen = id;
    }
  }
  return chosen;
}

/**
 * Scorecard metric labels for payroll sales KPI fields, from the dominant
 * active KPI policy on the run’s salary lines (fallback: default seed policy).
 */
export async function resolvePayrollRunSalesKpiScorecardMetrics(
  db: ResolveDb,
  payrollMonth: string,
  employeeIds: string[],
): Promise<KpiScorecardMetric[]> {
  const unique = [...new Set(employeeIds)];
  const policyIds: string[] = [];

  for (const employeeId of unique) {
    const profile = await resolveCompensationProfileForPayrollMonth(db, employeeId, payrollMonth);
    policyIds.push(profile?.kpiPolicyId ?? DEFAULT_KPI_POLICY_ID);
  }

  const kpiPolicyId =
    policyIds.length > 0 ? pickDominantKpiPolicyId(policyIds) : DEFAULT_KPI_POLICY_ID;

  const policy = await db.kpiPolicy.findFirst({
    where: { id: kpiPolicyId, status: 'ACTIVE' },
    select: { scorecardMetrics: true },
  });

  if (policy == null) {
    return [];
  }

  return parseKpiScorecardMetrics(policy.scorecardMetrics);
}

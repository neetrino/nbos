import { Decimal, type PrismaClient } from '@nbos/database';

import { resolveCompensationProfileForPayrollMonth } from '../compensation-profiles/resolve-active-compensation-profile';
import { computeKpiGatePayoutFactor } from './kpi-gate-payout';
import { parseKpiGateRules } from './parse-kpi-gate-rules';
import { listSalesPaymentFactsForEmployee } from './payroll-run-suggested-sales-actual';

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  'kpiResult' | 'kpiPolicy' | 'compensationProfile'
>;

type ActiveKpiPolicy = {
  id: string;
  gateRules: unknown;
  targetAmount: Decimal | null;
  targetSource: string | null;
  resultSource: string | null;
};

function attainmentPct(plan: Decimal | null, actual: Decimal | null): Decimal | null {
  if (plan == null || actual == null || plan.lte(0)) return null;
  return actual.div(plan).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function payoutFactor(plan: Decimal | null, actual: Decimal | null, rules: unknown): Decimal {
  if (plan == null || actual == null) return new Decimal(1);
  return computeKpiGatePayoutFactor(plan, actual, parseKpiGateRules(rules));
}

async function loadActiveKpiPolicy(
  db: Db,
  employeeId: string,
  profileMonth: string,
): Promise<{ profileId: string; policy: ActiveKpiPolicy } | null> {
  const profile = await resolveCompensationProfileForPayrollMonth(db, employeeId, profileMonth);
  if (!profile?.kpiPolicyId) {
    return null;
  }
  const policy = await db.kpiPolicy.findFirst({
    where: { id: profile.kpiPolicyId, status: 'ACTIVE' },
    select: {
      id: true,
      gateRules: true,
      targetAmount: true,
      targetSource: true,
      resultSource: true,
    },
  });
  if (!policy) {
    return null;
  }
  return { profileId: profile.id, policy };
}

async function upsertSalesKpiResult(
  db: Db,
  params: {
    employeeId: string;
    earnedPeriod: string;
    policy: ActiveKpiPolicy;
    compensationProfileId: string;
    plan: Decimal | null;
    actual: Decimal;
    pct: Decimal | null;
    factor: Decimal;
    sourceFacts: Record<string, unknown>;
    payrollRunId?: string;
    salaryLineId?: string;
  },
): Promise<void> {
  const payrollLink =
    params.payrollRunId != null
      ? { payrollRunId: params.payrollRunId, salaryLineId: params.salaryLineId ?? null }
      : {};

  await db.kpiResult.upsert({
    where: {
      employeeId_period_kpiPolicyId: {
        employeeId: params.employeeId,
        period: params.earnedPeriod,
        kpiPolicyId: params.policy.id,
      },
    },
    create: {
      employeeId: params.employeeId,
      kpiPolicyId: params.policy.id,
      compensationProfileId: params.compensationProfileId,
      period: params.earnedPeriod,
      planAmount: params.plan,
      actualAmount: params.actual,
      attainmentPct: params.pct,
      payoutFactor: params.factor,
      source: 'SYSTEM',
      sourceFacts: params.sourceFacts,
      ...payrollLink,
    },
    update: {
      compensationProfileId: params.compensationProfileId,
      planAmount: params.plan,
      actualAmount: params.actual,
      attainmentPct: params.pct,
      payoutFactor: params.factor,
      source: 'SYSTEM',
      sourceFacts: params.sourceFacts,
      ...payrollLink,
    },
  });
}

/** Event-driven / repair path: sync earned month KPI from sales payment facts. */
export async function syncSalesKpiForEarnedPeriodEmployee(
  db: Db,
  params: { employeeId: string; earnedPeriod: string },
): Promise<boolean> {
  const loaded = await loadActiveKpiPolicy(db, params.employeeId, params.earnedPeriod);
  if (!loaded) {
    return false;
  }

  const facts = await listSalesPaymentFactsForEmployee(db, params.earnedPeriod, params.employeeId);
  const plan = loaded.policy.targetAmount;
  const actual = facts.total;
  const sourceFacts = {
    targetSource: loaded.policy.targetSource,
    resultSource: loaded.policy.resultSource ?? 'SALES_PAYMENTS',
    salesPayments: facts.payments,
  };

  await upsertSalesKpiResult(db, {
    employeeId: params.employeeId,
    earnedPeriod: params.earnedPeriod,
    policy: loaded.policy,
    compensationProfileId: loaded.profileId,
    plan,
    actual,
    pct: attainmentPct(plan, actual),
    factor: payoutFactor(plan, actual, loaded.policy.gateRules),
    sourceFacts,
  });

  return true;
}

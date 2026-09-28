import {
  type Decimal,
  type InputJsonValue,
  type PrismaClient,
  type SalaryLineStatusEnum,
} from '@nbos/database';

import { resolveCompensationProfileForPayrollMonth } from '../compensation-profiles/resolve-active-compensation-profile';
import { parseKpiGateRules } from './parse-kpi-gate-rules';
import { listSalesPaymentFactsForEmployee } from './payroll-run-suggested-sales-actual';
import { isValidPayrollMonth } from './payroll-runs.constants';
import {
  pickUniqueEmployeePeriodKpiResult,
  roundSalesKpiAttainmentPct,
  roundSalesKpiMoney,
} from './sales-kpi-period-result';
import { resolveSalesKpiPayoutFactorOrHold } from './sales-kpi-payroll-payout';

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  'kpiResult' | 'kpiPolicy' | 'compensationProfile' | 'payment'
>;

type SalaryLinePaidLookup = {
  findUnique: (args: {
    where: { id: string };
    select: { status: true; paidAmount: true };
  }) => Promise<{ status: SalaryLineStatusEnum; paidAmount: Decimal } | null>;
};

type ActiveKpiPolicy = {
  id: string;
  gateRules: unknown;
  targetSource: string | null;
  resultSource: string | null;
};

type ExistingKpiResult = {
  id: string;
  planAmount: Decimal | null;
  salaryLineId: string | null;
};

const PAID_SALARY_LINE_STATUSES: ReadonlySet<SalaryLineStatusEnum> = new Set([
  'PAID',
  'PARTIALLY_PAID',
]);

function attainmentPct(plan: Decimal, actual: Decimal): Decimal {
  return roundSalesKpiAttainmentPct(actual.div(plan).mul(100));
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
      targetSource: true,
      resultSource: true,
    },
  });
  if (!policy) {
    return null;
  }
  return { profileId: profile.id, policy };
}

async function loadExistingPeriodResults(
  db: Db,
  employeeId: string,
  earnedPeriod: string,
): Promise<ExistingKpiResult[]> {
  return db.kpiResult.findMany({
    where: { employeeId, period: earnedPeriod },
    select: { id: true, planAmount: true, salaryLineId: true },
  });
}

function salaryLinePaidLookup(db: Db): SalaryLinePaidLookup | null {
  if (!('salaryLine' in db)) {
    return null;
  }
  const salaryLine = (db as Db & { salaryLine?: SalaryLinePaidLookup }).salaryLine;
  return salaryLine ?? null;
}

async function isLinkedSalaryLinePaid(db: Db, salaryLineId: string | null): Promise<boolean> {
  if (salaryLineId == null) {
    return false;
  }
  const salaryLine = salaryLinePaidLookup(db);
  if (salaryLine == null) {
    return true;
  }
  const line = await salaryLine.findUnique({
    where: { id: salaryLineId },
    select: { status: true, paidAmount: true },
  });
  if (line == null) {
    return false;
  }
  return PAID_SALARY_LINE_STATUSES.has(line.status) || line.paidAmount.gt(0);
}

async function persistComputedSalesKpiResult(
  db: Db,
  params: {
    existingId: string;
    compensationProfileId: string;
    policy: ActiveKpiPolicy;
    actual: Decimal;
    pct: Decimal;
    factor: Decimal;
    sourceFacts: Record<string, unknown>;
  },
): Promise<void> {
  await db.kpiResult.update({
    where: { id: params.existingId },
    data: {
      compensationProfileId: params.compensationProfileId,
      kpiPolicyId: params.policy.id,
      actualAmount: params.actual,
      attainmentPct: params.pct,
      payoutFactor: params.factor,
      sourceFacts: params.sourceFacts as InputJsonValue,
    },
  });
}

async function refreshUnpaidSalesKpiResult(
  db: Db,
  params: {
    employeeId: string;
    earnedPeriod: string;
    existing: ExistingKpiResult;
    loaded: { profileId: string; policy: ActiveKpiPolicy };
  },
): Promise<boolean> {
  const plan = params.existing.planAmount;
  if (plan == null || plan.lte(0)) {
    return false;
  }
  const facts = await listSalesPaymentFactsForEmployee(
    db as InstanceType<typeof PrismaClient>,
    params.earnedPeriod,
    params.employeeId,
  );
  const roundedPlan = roundSalesKpiMoney(plan);
  const actual = roundSalesKpiMoney(facts.total);
  const factor = resolveSalesKpiPayoutFactorOrHold(
    roundedPlan,
    actual,
    parseKpiGateRules(params.loaded.policy.gateRules),
  );
  if (factor == null) {
    return false;
  }
  await persistComputedSalesKpiResult(db, {
    existingId: params.existing.id,
    compensationProfileId: params.loaded.profileId,
    policy: params.loaded.policy,
    actual,
    pct: attainmentPct(roundedPlan, actual),
    factor,
    sourceFacts: {
      targetSource: params.loaded.policy.targetSource,
      resultSource: params.loaded.policy.resultSource ?? 'SALES_PAYMENTS',
      salesPayments: facts.payments,
    },
  });
  return true;
}

/** Event-driven / repair path: sync earned month KPI from sales payment facts. */
export async function syncSalesKpiForEarnedPeriodEmployee(
  db: Db,
  params: { employeeId: string; earnedPeriod: string },
): Promise<boolean> {
  if (!isValidPayrollMonth(params.earnedPeriod)) {
    return false;
  }
  const loaded = await loadActiveKpiPolicy(db, params.employeeId, params.earnedPeriod);
  if (!loaded) {
    return false;
  }

  const existingRows = await loadExistingPeriodResults(db, params.employeeId, params.earnedPeriod);
  const existing = pickUniqueEmployeePeriodKpiResult(existingRows);
  if (existing == null) {
    return false;
  }
  if (await isLinkedSalaryLinePaid(db, existing.salaryLineId)) {
    return true;
  }
  return refreshUnpaidSalesKpiResult(db, {
    employeeId: params.employeeId,
    earnedPeriod: params.earnedPeriod,
    existing,
    loaded,
  });
}

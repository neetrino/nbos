import { type Decimal, type PrismaClient } from '@nbos/database';

import { resolveCompensationPayrollPolicyForEmployee } from '../compensation-profiles/resolve-compensation-payroll-policy';
import {
  endOfPayrollMonthUtc,
  startOfPayrollMonthUtc,
} from '../compensation-profiles/compensation-profile-payroll-month';
import { buildEmployeeSalesKpiDetailFromResult } from './employee-sales-kpi-month-detail';
import { earnedSalesPeriodForPayoutMonth } from './earned-sales-kpi-period';
import type {
  EmployeeSalesKpiDetailDto,
  SalaryBoardSalesKpiSummaryDto,
} from './salary-line-month-detail.types';

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  'kpiResult' | 'compensationProfile' | 'kpiPolicy'
>;

type KpiResultRow = {
  planAmount: Decimal | null;
  actualAmount: Decimal | null;
  attainmentPct: Decimal | null;
  payoutFactor: Decimal;
};

export type EmployeeSalesKpiForPayoutMonth = EmployeeSalesKpiDetailDto & {
  earnedPeriod: string | null;
  hasKpiPolicy: boolean;
};

type ProfileRow = {
  employeeId: string;
  kpiPolicyId: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

function pickProfileForPayrollMonth(
  profiles: ProfileRow[],
  employeeId: string,
  payrollMonth: string,
): ProfileRow | null {
  const monthStart = startOfPayrollMonthUtc(payrollMonth);
  const monthEnd = endOfPayrollMonthUtc(payrollMonth);
  const active = profiles.filter(
    (p) =>
      p.employeeId === employeeId &&
      p.effectiveFrom <= monthEnd &&
      (p.effectiveTo == null || p.effectiveTo >= monthStart),
  );
  if (active.length === 0) {
    return null;
  }
  return active.sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0] ?? null;
}

async function findKpiResultForEarnedPeriod(
  db: Db,
  params: {
    employeeId: string;
    earnedPeriod: string;
    kpiPolicyId: string;
    salaryLineId?: string;
    payrollRunId?: string;
  },
): Promise<KpiResultRow | null> {
  const orClause =
    params.salaryLineId != null || params.payrollRunId != null
      ? {
          OR: [
            ...(params.salaryLineId != null ? [{ salaryLineId: params.salaryLineId }] : []),
            ...(params.payrollRunId != null ? [{ payrollRunId: params.payrollRunId }] : []),
          ],
        }
      : {};

  return db.kpiResult.findFirst({
    where: {
      employeeId: params.employeeId,
      period: params.earnedPeriod,
      kpiPolicyId: params.kpiPolicyId,
      ...orClause,
    },
    select: {
      planAmount: true,
      actualAmount: true,
      attainmentPct: true,
      payoutFactor: true,
    },
  });
}

/** Resolves Sales KPI snapshot for a payout payroll month (earned period = prior month). */
export async function resolveEmployeeSalesKpiForPayoutMonth(
  db: Db,
  params: {
    employeeId: string;
    payoutMonth: string;
    salaryLineId?: string;
    payrollRunId?: string;
  },
): Promise<EmployeeSalesKpiForPayoutMonth> {
  const payrollPolicy = await resolveCompensationPayrollPolicyForEmployee(
    db,
    params.employeeId,
    params.payoutMonth,
  );
  if (payrollPolicy.kpiPolicyId == null) {
    const detail = buildEmployeeSalesKpiDetailFromResult({
      kpiPolicyId: null,
      result: null,
    });
    return { ...detail, earnedPeriod: null, hasKpiPolicy: false };
  }

  const earnedPeriod = earnedSalesPeriodForPayoutMonth(params.payoutMonth);
  const result = await findKpiResultForEarnedPeriod(db, {
    employeeId: params.employeeId,
    earnedPeriod,
    kpiPolicyId: payrollPolicy.kpiPolicyId,
    salaryLineId: params.salaryLineId,
    payrollRunId: params.payrollRunId,
  });
  const detail = buildEmployeeSalesKpiDetailFromResult({
    kpiPolicyId: payrollPolicy.kpiPolicyId,
    result,
  });
  return { ...detail, earnedPeriod, hasKpiPolicy: true };
}

function toBoardSummary(
  earnedPeriod: string,
  detail: EmployeeSalesKpiDetailDto,
): SalaryBoardSalesKpiSummaryDto {
  const payoutFactorPct =
    detail.payoutFactor != null
      ? String(Math.round(Number.parseFloat(detail.payoutFactor) * 100))
      : null;
  return {
    earnedPeriod,
    source: detail.source,
    planAmount: detail.planAmount,
    actualAmount: detail.actualAmount,
    attainmentPct: detail.attainmentPct,
    payoutFactorPct,
  };
}

export type SalaryBoardKpiCellKey = {
  employeeId: string;
  payoutMonth: string;
  salaryLineId: string;
  payrollRunId: string;
};

/** Batch KPI summaries for salary board cells (one query per entity type). */
export async function batchSalaryBoardSalesKpiSummaries(
  db: Db,
  cells: SalaryBoardKpiCellKey[],
): Promise<Map<string, SalaryBoardSalesKpiSummaryDto>> {
  const out = new Map<string, SalaryBoardSalesKpiSummaryDto>();
  if (cells.length === 0) {
    return out;
  }

  const employeeIds = [...new Set(cells.map((c) => c.employeeId))];
  const profiles = await db.compensationProfile.findMany({
    where: { employeeId: { in: employeeIds }, status: 'ACTIVE' },
    select: {
      employeeId: true,
      kpiPolicyId: true,
      effectiveFrom: true,
      effectiveTo: true,
    },
  });

  const earnedPeriods = [
    ...new Set(cells.map((c) => earnedSalesPeriodForPayoutMonth(c.payoutMonth))),
  ];
  const kpiResults = await db.kpiResult.findMany({
    where: {
      employeeId: { in: employeeIds },
      period: { in: earnedPeriods },
    },
    select: {
      employeeId: true,
      period: true,
      kpiPolicyId: true,
      salaryLineId: true,
      payrollRunId: true,
      planAmount: true,
      actualAmount: true,
      attainmentPct: true,
      payoutFactor: true,
    },
  });

  for (const cell of cells) {
    const profile = pickProfileForPayrollMonth(profiles, cell.employeeId, cell.payoutMonth);
    if (profile?.kpiPolicyId == null) {
      continue;
    }
    const earnedPeriod = earnedSalesPeriodForPayoutMonth(cell.payoutMonth);
    const result =
      kpiResults.find(
        (r) =>
          r.employeeId === cell.employeeId &&
          r.period === earnedPeriod &&
          r.kpiPolicyId === profile.kpiPolicyId &&
          (r.salaryLineId === cell.salaryLineId || r.payrollRunId === cell.payrollRunId),
      ) ??
      kpiResults.find(
        (r) =>
          r.employeeId === cell.employeeId &&
          r.period === earnedPeriod &&
          r.kpiPolicyId === profile.kpiPolicyId,
      ) ??
      null;

    const detail = buildEmployeeSalesKpiDetailFromResult({
      kpiPolicyId: profile.kpiPolicyId,
      result,
    });
    out.set(cell.salaryLineId, toBoardSummary(earnedPeriod, detail));
  }

  return out;
}

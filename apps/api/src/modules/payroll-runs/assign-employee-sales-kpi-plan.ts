import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, type PrismaClient, type SalaryLineStatusEnum } from '@nbos/database';

import { resolveCompensationProfileForPayrollMonth } from '../compensation-profiles/resolve-active-compensation-profile';
import {
  assertCompanyWideFinanceAccess,
  FINANCE_SALARY_MODULE,
  type FinancePayActor,
} from '../compensation-profiles/finance-pay-access';
import { isValidPayrollMonth } from './payroll-runs.constants';
import { refreshSalesBonusesForEarnedMonth } from '../bonus/sales-bonus-kpi-payable';
import { pickUniqueEmployeePeriodKpiResult, roundSalesKpiMoney } from './sales-kpi-period-result';

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  | 'employee'
  | 'kpiResult'
  | 'kpiPolicy'
  | 'compensationProfile'
  | 'payment'
  | 'salaryLine'
  | 'bonusEntry'
>;

export type AssignEmployeeSalesKpiPlanInput = {
  employeeId: string;
  period: string;
  planAmount: number;
};

export type AssignedEmployeeSalesKpiPlan = {
  id: string;
  employeeId: string;
  period: string;
  planAmount: string;
};

const PAID_SALARY_LINE_STATUSES: ReadonlySet<SalaryLineStatusEnum> = new Set([
  'PAID',
  'PARTIALLY_PAID',
]);

function assertAssignablePlan(input: AssignEmployeeSalesKpiPlanInput): {
  employeeId: string;
  period: string;
  plan: Decimal;
} {
  const employeeId = input.employeeId.trim();
  const period = input.period.trim();
  if (employeeId.length === 0) {
    throw new BadRequestException('employeeId is required');
  }
  if (!isValidPayrollMonth(period)) {
    throw new BadRequestException('period must be YYYY-MM');
  }
  if (!Number.isFinite(input.planAmount) || input.planAmount <= 0) {
    throw new BadRequestException('planAmount must be a positive number');
  }
  return { employeeId, period, plan: roundSalesKpiMoney(new Decimal(input.planAmount)) };
}

async function assertNotLinkedToPaidSalaryLine(db: Db, salaryLineId: string | null): Promise<void> {
  if (salaryLineId == null) {
    return;
  }
  const line = await db.salaryLine.findUnique({
    where: { id: salaryLineId },
    select: { status: true, paidAmount: true },
  });
  if (line != null && (PAID_SALARY_LINE_STATUSES.has(line.status) || line.paidAmount.gt(0))) {
    throw new BadRequestException(
      'A stored plan linked to a paid salary line cannot be overwritten.',
    );
  }
}

async function createAssignedPlanRow(
  db: Db,
  params: { employeeId: string; period: string; plan: Decimal },
): Promise<string> {
  const profile = await resolveCompensationProfileForPayrollMonth(
    db,
    params.employeeId,
    params.period,
  );
  const created = await db.kpiResult.create({
    data: {
      employeeId: params.employeeId,
      period: params.period,
      planAmount: params.plan,
      kpiPolicyId: profile?.kpiPolicyId ?? null,
      compensationProfileId: profile?.id ?? null,
      source: 'MANUAL',
      sourceFacts: { planSource: 'FINANCE_ASSIGNMENT' },
    },
  });
  return created.id;
}

/** Finance assigns one employee's calendar-month Sales KPI plan. Does not copy a policy target. */
export async function assignEmployeeSalesKpiPlan(
  db: Db,
  actor: FinancePayActor,
  input: AssignEmployeeSalesKpiPlanInput,
): Promise<AssignedEmployeeSalesKpiPlan> {
  assertCompanyWideFinanceAccess(actor, FINANCE_SALARY_MODULE, 'EDIT');
  const { employeeId, period, plan } = assertAssignablePlan(input);

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });
  if (!employee) {
    throw new NotFoundException(`Employee ${employeeId} not found`);
  }

  const rows = await db.kpiResult.findMany({
    where: { employeeId, period },
    select: { id: true, salaryLineId: true },
  });
  const existing = pickUniqueEmployeePeriodKpiResult(rows);
  if (rows.length > 1) {
    throw new BadRequestException(
      'Multiple KPI results exist for this employee and month; resolve them before assigning a plan.',
    );
  }

  if (existing != null) {
    await assertNotLinkedToPaidSalaryLine(db, existing.salaryLineId);
    await db.kpiResult.update({
      where: { id: existing.id },
      data: { planAmount: plan, source: 'MANUAL' },
    });
  }

  const id = existing?.id ?? (await createAssignedPlanRow(db, { employeeId, period, plan }));
  await refreshSalesBonusesForEarnedMonth(db, { employeeId, earnedPeriod: period });
  return { id, employeeId, period, planAmount: plan.toFixed(2) };
}

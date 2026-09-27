import { BadRequestException } from '@nestjs/common';
import { Decimal, type TransactionClient } from '@nbos/database';
import { payrollMonthForInstant } from '../compensation-profiles/compensation-profile-payroll-month';
import {
  coveringApprovedProfiles,
  hasApprovedProfileStartingAfterPayrollMonth,
  hasHistoricalProfileStartingOnOrBeforePayrollMonth,
  pickSingleCoveringApprovedProfile,
  HISTORICAL_COMPENSATION_PROFILE_STATUSES,
  type ApprovedCompensationProfileRange,
} from '../compensation-profiles/resolve-active-compensation-profile';

const TERMINATED_EMPLOYEE_STATUS = 'TERMINATED';

export type PayrollSalarySeedTx = Pick<
  TransactionClient,
  'employee' | 'compensationProfile' | 'salaryLine' | '$queryRaw'
>;

interface SeedEmployeeRow {
  id: string;
  status: string;
  firstName: string;
  lastName: string;
  fireDate: Date | null;
}

interface PlannedSalaryLine {
  employeeId: string;
  compensationProfileId: string;
  baseSalary: Decimal;
}

/**
 * Seeds one salary line per employee with an approved profile covering the month.
 * Missing approved terms fail the whole seed; a later scheduled first salary explains absence.
 */
export async function seedPayrollRunSalaryLines(
  tx: PayrollSalarySeedTx,
  payrollRunId: string,
  payrollMonth: string,
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM employees ORDER BY id FOR UPDATE`;
  const employees = await tx.employee.findMany({
    select: { id: true, status: true, firstName: true, lastName: true, fireDate: true },
    orderBy: { id: 'asc' },
  });
  const profiles = await tx.compensationProfile.findMany({
    where: { status: { in: HISTORICAL_COMPENSATION_PROFILE_STATUSES } },
    select: {
      id: true,
      employeeId: true,
      baseSalary: true,
      currency: true,
      kpiPolicyId: true,
      effectiveFrom: true,
      effectiveTo: true,
      status: true,
    },
  });
  const planned = planPayrollSalaryLines(employees, profiles, payrollMonth);
  await insertPayrollSalaryLines(tx, payrollRunId, planned);
}

export function planPayrollSalaryLines(
  employees: SeedEmployeeRow[],
  profiles: ApprovedCompensationProfileRange[],
  payrollMonth: string,
): PlannedSalaryLine[] {
  const missing: string[] = [];
  const planned: PlannedSalaryLine[] = [];
  for (const employee of employees) {
    const plannedLine = planEmployeeSalaryLine(employee, profiles, payrollMonth, missing);
    if (plannedLine != null) {
      planned.push(plannedLine);
    }
  }
  if (missing.length > 0) {
    throw new BadRequestException(
      `Cannot seed payroll ${payrollMonth}: no approved compensation profile covering this month for ${missing.join(', ')}`,
    );
  }
  return planned;
}

function planEmployeeSalaryLine(
  employee: SeedEmployeeRow,
  profiles: ApprovedCompensationProfileRange[],
  payrollMonth: string,
  missing: string[],
): PlannedSalaryLine | null {
  if (employee.status === TERMINATED_EMPLOYEE_STATUS) {
    return planTerminatedSalaryLine(employee, profiles, payrollMonth);
  }
  const coveringLine = coveringSalaryLine(employee.id, profiles, payrollMonth);
  if (coveringLine != null) {
    return coveringLine;
  }
  if (isWaitingForFirstApprovedSalary(profiles, employee.id, payrollMonth)) {
    return null;
  }
  missing.push(`${employee.firstName} ${employee.lastName} (${employee.id})`);
  return null;
}

function planTerminatedSalaryLine(
  employee: SeedEmployeeRow,
  profiles: ApprovedCompensationProfileRange[],
  payrollMonth: string,
): PlannedSalaryLine | null {
  if (employee.fireDate == null) {
    return null;
  }
  if (payrollMonthForInstant(employee.fireDate) < payrollMonth) {
    return null;
  }
  return coveringSalaryLine(employee.id, profiles, payrollMonth);
}

function coveringSalaryLine(
  employeeId: string,
  profiles: ApprovedCompensationProfileRange[],
  payrollMonth: string,
): PlannedSalaryLine | null {
  const covering = coveringApprovedProfiles(profiles, employeeId, payrollMonth);
  const profile = pickSingleCoveringApprovedProfile(covering, employeeId, payrollMonth);
  if (profile == null) {
    return null;
  }
  return {
    employeeId,
    compensationProfileId: profile.id,
    baseSalary: new Decimal(profile.baseSalary.toString()),
  };
}

function isWaitingForFirstApprovedSalary(
  profiles: ApprovedCompensationProfileRange[],
  employeeId: string,
  payrollMonth: string,
): boolean {
  if (!hasApprovedProfileStartingAfterPayrollMonth(profiles, employeeId, payrollMonth)) {
    return false;
  }
  return !hasHistoricalProfileStartingOnOrBeforePayrollMonth(profiles, employeeId, payrollMonth);
}

async function insertPayrollSalaryLines(
  tx: PayrollSalarySeedTx,
  payrollRunId: string,
  planned: PlannedSalaryLine[],
): Promise<void> {
  const zero = new Decimal(0);
  for (const line of planned) {
    const totalPayable = line.baseSalary;
    await tx.salaryLine.create({
      data: {
        payrollRunId,
        employeeId: line.employeeId,
        compensationProfileId: line.compensationProfileId,
        baseSalary: line.baseSalary,
        bonusesTotal: zero,
        totalPayable,
        paidAmount: zero,
        remainingAmount: totalPayable,
      },
    });
  }
}

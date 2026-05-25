import { BadRequestException } from '@nestjs/common';
import { PrismaClient, type PayrollRunStatusEnum, type SalaryLineStatusEnum } from '@nbos/database';
import { resolveCompensationPayoutPhase } from './compensation-payout-phase';
import type { CompensationPayoutPhase } from './compensation-payout-phase';
import { isValidPayrollMonth } from './payroll-runs.constants';

/** Inclusive window length when `payrollMonthFrom` is omitted (calendar months). */
export const SALARY_BOARD_DEFAULT_MONTH_COUNT = 12;

/** Hard cap on requested month span (inclusive). */
export const SALARY_BOARD_MAX_MONTH_SPAN = 36;

function utcPayrollMonthNow(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function addPayrollMonths(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  const safeY = Number.isFinite(y) ? y : 1970;
  const safeM = Number.isFinite(m) ? m : 1;
  const d = new Date(Date.UTC(safeY, safeM - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function enumeratePayrollMonths(from: string, to: string): string[] {
  if (from > to) return [];
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addPayrollMonths(cur, 1);
  }
  return out;
}

export interface SalaryBoardCellDto {
  salaryLineId: string;
  payrollRunId: string;
  payrollMonth: string;
  runStatus: PayrollRunStatusEnum;
  lineStatus: SalaryLineStatusEnum;
  payoutPhase: CompensationPayoutPhase;
  totalPayable: string;
  paidAmount: string;
  remainingAmount: string;
}

export interface SalaryBoardEmployeeDto {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  /** All department memberships (for client-side board filter). */
  departmentIds: string[];
  primaryDepartmentId: string | null;
}

export interface SalaryBoardColumnDto {
  payrollMonth: string;
  payrollRunId: string | null;
  runStatus: PayrollRunStatusEnum | null;
}

export interface SalaryBoardRowDto {
  employee: SalaryBoardEmployeeDto;
  /** One entry per `months` index (nullable when no run or no line for that employee/month). */
  cells: (SalaryBoardCellDto | null)[];
}

export interface SalaryBoardResponseDto {
  payrollMonthFrom: string;
  payrollMonthTo: string;
  months: string[];
  columns: SalaryBoardColumnDto[];
  rows: SalaryBoardRowDto[];
}

export interface SalaryBoardQueryParams {
  payrollMonthFrom?: string;
  payrollMonthTo?: string;
}

function moneyToString(value: { toFixed: (n: number) => string }): string {
  return value.toFixed(2);
}

type EmployeeWithDepartments = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  departments: Array<{ departmentId: string; isPrimary: boolean }>;
};

function mapSalaryBoardEmployee(emp: EmployeeWithDepartments): SalaryBoardEmployeeDto {
  const primary = emp.departments.find((d) => d.isPrimary);
  return {
    id: emp.id,
    firstName: emp.firstName,
    lastName: emp.lastName,
    position: emp.position,
    departmentIds: emp.departments.map((d) => d.departmentId),
    primaryDepartmentId: primary?.departmentId ?? emp.departments[0]?.departmentId ?? null,
  };
}

function resolveMonthRange(params: SalaryBoardQueryParams): {
  from: string;
  to: string;
  months: string[];
} {
  const rawTo = params.payrollMonthTo?.trim();
  const rawFrom = params.payrollMonthFrom?.trim();
  const to = rawTo && isValidPayrollMonth(rawTo) ? rawTo : utcPayrollMonthNow();
  if (rawTo && !isValidPayrollMonth(rawTo)) {
    throw new BadRequestException('payrollMonthTo must be YYYY-MM');
  }
  const fromDefault = addPayrollMonths(to, -(SALARY_BOARD_DEFAULT_MONTH_COUNT - 1));
  const from = rawFrom && isValidPayrollMonth(rawFrom) ? rawFrom : fromDefault;
  if (rawFrom && !isValidPayrollMonth(rawFrom)) {
    throw new BadRequestException('payrollMonthFrom must be YYYY-MM');
  }
  if (from > to) {
    throw new BadRequestException('payrollMonthFrom must be <= payrollMonthTo');
  }
  const months = enumeratePayrollMonths(from, to);
  if (months.length === 0) {
    throw new BadRequestException('Invalid month range');
  }
  if (months.length > SALARY_BOARD_MAX_MONTH_SPAN) {
    throw new BadRequestException(
      `Month range must be at most ${SALARY_BOARD_MAX_MONTH_SPAN} inclusive months`,
    );
  }
  return { from, to, months };
}

export async function querySalaryBoard(
  prisma: InstanceType<typeof PrismaClient>,
  params: SalaryBoardQueryParams,
): Promise<SalaryBoardResponseDto> {
  const { from, to, months } = resolveMonthRange(params);

  const [employees, runs, lines] = await Promise.all([
    prisma.employee.findMany({
      where: { status: { not: 'TERMINATED' } },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        departments: { select: { departmentId: true, isPrimary: true } },
      },
    }),
    prisma.payrollRun.findMany({
      where: { payrollMonth: { gte: from, lte: to } },
      select: { id: true, payrollMonth: true, status: true },
    }),
    prisma.salaryLine.findMany({
      where: { payrollRun: { payrollMonth: { gte: from, lte: to } } },
      select: {
        id: true,
        payrollRunId: true,
        employeeId: true,
        totalPayable: true,
        paidAmount: true,
        remainingAmount: true,
        status: true,
      },
    }),
  ]);

  const runByMonth = new Map<string, { id: string; status: PayrollRunStatusEnum }>();
  for (const r of runs) {
    runByMonth.set(r.payrollMonth, { id: r.id, status: r.status });
  }

  const lineByRunEmployee = new Map<string, (typeof lines)[number]>();
  for (const line of lines) {
    lineByRunEmployee.set(`${line.payrollRunId}:${line.employeeId}`, line);
  }

  const columns: SalaryBoardColumnDto[] = months.map((m) => {
    const meta = runByMonth.get(m);
    return {
      payrollMonth: m,
      payrollRunId: meta?.id ?? null,
      runStatus: meta?.status ?? null,
    };
  });

  const rows: SalaryBoardRowDto[] = employees.map((emp) => {
    const cells = months.map((month) => {
      const meta = runByMonth.get(month);
      if (!meta) return null;
      const line = lineByRunEmployee.get(`${meta.id}:${emp.id}`);
      if (!line) return null;
      return {
        salaryLineId: line.id,
        payrollRunId: meta.id,
        payrollMonth: month,
        runStatus: meta.status,
        lineStatus: line.status,
        payoutPhase: resolveCompensationPayoutPhase({
          payrollMonth: month,
          runStatus: meta.status,
          lineStatus: line.status,
        }),
        totalPayable: moneyToString(line.totalPayable),
        paidAmount: moneyToString(line.paidAmount),
        remainingAmount: moneyToString(line.remainingAmount),
      };
    });
    return {
      employee: mapSalaryBoardEmployee(emp),
      cells,
    };
  });

  return {
    payrollMonthFrom: from,
    payrollMonthTo: to,
    months,
    columns,
    rows,
  };
}

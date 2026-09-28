import { NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import {
  FINANCE_SALARY_MODULE,
  assertCompanyWideFinanceAccess,
  assertEmployeeAccessible,
  assertFinancePayScope,
  resolveAccessibleEmployeeIds,
  type AccessibleEmployeeIds,
  type FinancePayActor,
} from '../compensation-profiles/finance-pay-access';

export function toFinancePayActor(user: CurrentUserPayload): FinancePayActor {
  return user;
}

export async function resolvePayrollReadAccess(
  prisma: InstanceType<typeof PrismaClient>,
  actor: FinancePayActor,
): Promise<AccessibleEmployeeIds> {
  const scope = assertFinancePayScope(actor, FINANCE_SALARY_MODULE, 'VIEW', ['ALL', 'DEPARTMENT']);
  return resolveAccessibleEmployeeIds(prisma, actor, scope);
}

export function assertPayrollWriteAccess(actor: FinancePayActor, action: 'ADD' | 'EDIT'): void {
  assertCompanyWideFinanceAccess(actor, FINANCE_SALARY_MODULE, action);
}

export async function assertSalaryLineReadable(
  prisma: InstanceType<typeof PrismaClient>,
  actor: FinancePayActor,
  salaryLineId: string,
): Promise<void> {
  const accessible = await resolvePayrollReadAccess(prisma, actor);
  const line = await prisma.salaryLine.findUnique({
    where: { id: salaryLineId },
    select: { employeeId: true },
  });
  if (!line) {
    throw new NotFoundException(`Salary line ${salaryLineId} not found`);
  }
  assertEmployeeAccessible(line.employeeId, accessible);
}

export function filterSalaryLinesByAccess<T extends { employeeId: string }>(
  lines: T[],
  accessible: AccessibleEmployeeIds,
): T[] {
  if (accessible === 'ALL') return lines;
  return lines.filter((line) => accessible.includes(line.employeeId));
}

export async function overlayPayrollRunListTotals<T extends { id: string }>(
  prisma: InstanceType<typeof PrismaClient>,
  items: T[],
  accessible: AccessibleEmployeeIds,
): Promise<T[]> {
  if (accessible === 'ALL' || items.length === 0) return items;
  const byRun = await salaryLineSumsByRun(
    prisma,
    items.map((item) => item.id),
    accessible,
  );
  return items.map((item) => {
    const sums = byRun.get(item.id);
    return {
      ...item,
      totalBaseSalary: sums?.baseSalary ?? new Decimal(0),
      totalBonuses: sums?.bonusesTotal ?? new Decimal(0),
      totalPayable: sums?.totalPayable ?? new Decimal(0),
      totalPaid: sums?.paidAmount ?? new Decimal(0),
    };
  });
}

type PayrollRunHeaderMoney = {
  totalBaseSalary: Decimal;
  totalBonuses: Decimal;
  totalPayable: Decimal;
  totalPaid: Decimal;
};

type SalaryLineMoneyFields = {
  baseSalary: Decimal | string | number;
  bonusesTotal: Decimal | string | number;
  totalPayable: Decimal | string | number;
  paidAmount: Decimal | string | number;
  expenseId: string | null;
};

/** Department/OWN detail header: scoped line sums, not stored company-wide run totals. */
export function overlayPayrollRunDetailTotals<T extends Record<string, unknown>>(
  run: T,
  scopedLines: readonly SalaryLineMoneyFields[],
  accessible: AccessibleEmployeeIds,
  companyMaterializedCount: number,
): T & { materializedExpenseLineCount: number } {
  if (accessible === 'ALL') {
    return { ...run, materializedExpenseLineCount: companyMaterializedCount };
  }
  return {
    ...run,
    ...sumScopedSalaryLineMoney(scopedLines),
    materializedExpenseLineCount: scopedLines.filter((line) => line.expenseId != null).length,
  };
}

function sumScopedSalaryLineMoney(lines: readonly SalaryLineMoneyFields[]): PayrollRunHeaderMoney {
  let totalBaseSalary = new Decimal(0);
  let totalBonuses = new Decimal(0);
  let totalPayable = new Decimal(0);
  let totalPaid = new Decimal(0);
  for (const line of lines) {
    totalBaseSalary = totalBaseSalary.plus(new Decimal(line.baseSalary));
    totalBonuses = totalBonuses.plus(new Decimal(line.bonusesTotal));
    totalPayable = totalPayable.plus(new Decimal(line.totalPayable));
    totalPaid = totalPaid.plus(new Decimal(line.paidAmount));
  }
  return { totalBaseSalary, totalBonuses, totalPayable, totalPaid };
}

async function salaryLineSumsByRun(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunIds: string[],
  employeeIds: string[],
) {
  const grouped = await prisma.salaryLine.groupBy({
    by: ['payrollRunId'],
    where: { payrollRunId: { in: payrollRunIds }, employeeId: { in: employeeIds } },
    _sum: {
      baseSalary: true,
      bonusesTotal: true,
      totalPayable: true,
      paidAmount: true,
    },
  });
  return new Map(grouped.map((row) => [row.payrollRunId, row._sum] as const));
}

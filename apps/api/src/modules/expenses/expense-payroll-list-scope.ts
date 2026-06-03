import type { Prisma } from '@nbos/database';

export interface ExpensePayrollListScopeParams {
  payrollLinked?: boolean;
  payrollMonth?: string;
  payrollEmployeeId?: string;
}

const PAYROLL_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Pay Now / payroll drill-down: project participation must not hide salary-line expenses. */
export function isPayrollExpenseListScope(params: ExpensePayrollListScopeParams): boolean {
  const month = normalizePayrollMonthParam(params.payrollMonth);
  const employeeId = params.payrollEmployeeId?.trim() || undefined;
  return params.payrollLinked === true || Boolean(month || employeeId);
}

/** Applies payroll salary-line scope to expense list/stats `where` (NBOS Pay Now). */
export function applyPayrollExpenseListScope(
  where: Prisma.ExpenseWhereInput,
  params: ExpensePayrollListScopeParams,
): void {
  const month = normalizePayrollMonthParam(params.payrollMonth);
  const employeeId = params.payrollEmployeeId?.trim() || undefined;
  const linkedOnly = params.payrollLinked === true || Boolean(month || employeeId);

  if (linkedOnly) {
    where.salaryLine = { isNot: null };
  }

  if (!month && !employeeId) {
    return;
  }

  where.salaryLine = {
    is: {
      ...(employeeId ? { employeeId } : {}),
      ...(month ? { payrollRun: { payrollMonth: month } } : {}),
    },
  };
}

function normalizePayrollMonthParam(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === 'all') {
    return undefined;
  }
  return PAYROLL_MONTH_REGEX.test(trimmed) ? trimmed : undefined;
}

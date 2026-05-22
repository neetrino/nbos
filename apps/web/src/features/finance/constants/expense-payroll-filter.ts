/** Integrated filter keys for Pay Now payroll expense scope. */
export const EXPENSE_PAYROLL_SOURCE_FILTER_KEY = 'payrollSource' as const;
export const EXPENSE_PAYROLL_MONTH_FILTER_KEY = 'payrollMonth' as const;
export const EXPENSE_PAYROLL_EMPLOYEE_FILTER_KEY = 'payrollEmployee' as const;

export const EXPENSE_PAYROLL_SOURCE_PAYROLL = 'payroll' as const;
export const EXPENSE_PAYROLL_SOURCE_ALL = 'all' as const;

/** URL preset: open Pay Now with payroll salary filter applied. */
export const EXPENSE_PAYROLL_PRESET_QUERY = 'payrollPreset' as const;

const EXPENSE_LIST_PATH = '/finance/expenses' as const;

/** URL query for payroll month filter on Pay Now (YYYY-MM). */
export const EXPENSE_PAYROLL_MONTH_URL_QUERY = 'payrollMonth' as const;

export function expensesPayrollPresetHref(options?: { payrollMonth?: string }): string {
  const q = new URLSearchParams({ [EXPENSE_PAYROLL_PRESET_QUERY]: '1' });
  const month = options?.payrollMonth?.trim();
  if (month) {
    q.set(EXPENSE_PAYROLL_MONTH_URL_QUERY, month);
  }
  return `${EXPENSE_LIST_PATH}?${q.toString()}`;
}

export function buildRecentPayrollMonthFilterOptions(count = 18): Array<{
  value: string;
  label: string;
}> {
  const options: Array<{ value: string; label: string }> = [];
  const cursor = new Date();
  cursor.setUTCDate(1);
  for (let i = 0; i < count; i += 1) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const value = `${y}-${m}`;
    options.push({ value, label: value });
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return options;
}

export function resolveExpensePayrollListParams(filters: Record<string, string>): {
  payrollLinked?: boolean;
  payrollMonth?: string;
  payrollEmployeeId?: string;
} {
  const source = filters[EXPENSE_PAYROLL_SOURCE_FILTER_KEY] ?? EXPENSE_PAYROLL_SOURCE_ALL;
  const monthRaw = filters[EXPENSE_PAYROLL_MONTH_FILTER_KEY];
  const employeeRaw = filters[EXPENSE_PAYROLL_EMPLOYEE_FILTER_KEY];
  const payrollMonth = monthRaw && monthRaw !== 'all' ? monthRaw : undefined;
  const payrollEmployeeId = employeeRaw && employeeRaw !== 'all' ? employeeRaw : undefined;
  const payrollLinked =
    source === EXPENSE_PAYROLL_SOURCE_PAYROLL || Boolean(payrollMonth || payrollEmployeeId)
      ? true
      : undefined;

  return { payrollLinked, payrollMonth, payrollEmployeeId };
}

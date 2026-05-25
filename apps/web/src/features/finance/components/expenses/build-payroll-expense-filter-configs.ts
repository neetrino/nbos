import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  buildRecentPayrollMonthFilterOptions,
  EXPENSE_PAYROLL_EMPLOYEE_FILTER_KEY,
  EXPENSE_PAYROLL_MONTH_FILTER_KEY,
  EXPENSE_PAYROLL_SOURCE_ALL,
  EXPENSE_PAYROLL_SOURCE_FILTER_KEY,
  EXPENSE_PAYROLL_SOURCE_PAYROLL,
} from '@/features/finance/constants/expense-payroll-filter';

export function buildPayrollExpenseFilterConfigs(
  employeeOptions: Array<{ value: string; label: string }>,
): FilterConfig[] {
  const monthOptions = buildRecentPayrollMonthFilterOptions();

  return [
    {
      key: EXPENSE_PAYROLL_SOURCE_FILTER_KEY,
      label: 'Source',
      includeAllOption: false,
      defaultOptionValue: EXPENSE_PAYROLL_SOURCE_ALL,
      options: [
        { value: EXPENSE_PAYROLL_SOURCE_ALL, label: 'All expenses' },
        { value: EXPENSE_PAYROLL_SOURCE_PAYROLL, label: 'Payroll salary' },
      ],
    },
    {
      key: EXPENSE_PAYROLL_MONTH_FILTER_KEY,
      label: 'Payroll month',
      options: monthOptions,
    },
    {
      key: EXPENSE_PAYROLL_EMPLOYEE_FILTER_KEY,
      label: 'Employee',
      options: employeeOptions,
    },
  ];
}

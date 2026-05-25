import type { FilterConfig } from '@/components/shared/FilterBar';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';

export const PAYROLL_FILTER_STATUS_KEY = 'status' as const;
export const PAYROLL_FILTER_MONTH_FROM_KEY = 'payrollMonthFrom' as const;
export const PAYROLL_FILTER_MONTH_TO_KEY = 'payrollMonthTo' as const;

const STATUS_OPTIONS: PayrollRunStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'PAYING', 'CLOSED'];

export function buildPayrollMonthRangeFilterConfigs(): FilterConfig[] {
  return buildPayrollIntegratedFilterConfigs().filter((item) => item.fieldType === 'month');
}

export function buildPayrollIntegratedFilterConfigs(): FilterConfig[] {
  return [
    {
      key: PAYROLL_FILTER_STATUS_KEY,
      label: 'Status',
      options: STATUS_OPTIONS.map((status) => ({
        value: status,
        label: PAYROLL_RUN_STATUS_LABEL[status],
      })),
    },
    {
      key: PAYROLL_FILTER_MONTH_FROM_KEY,
      label: 'Month from',
      fieldType: 'month',
      options: [],
    },
    {
      key: PAYROLL_FILTER_MONTH_TO_KEY,
      label: 'Month to',
      fieldType: 'month',
      options: [],
    },
  ];
}

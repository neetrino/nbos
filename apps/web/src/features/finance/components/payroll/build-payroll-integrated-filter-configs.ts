import type { FilterConfig } from '@/components/shared/FilterBar';
import { PAYROLL_RUN_STATUS_MESSAGE_KEY } from '@/features/finance/constants/payroll-run-ui';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';

export const PAYROLL_FILTER_STATUS_KEY = 'status' as const;
export const PAYROLL_FILTER_MONTH_FROM_KEY = 'payrollMonthFrom' as const;
export const PAYROLL_FILTER_MONTH_TO_KEY = 'payrollMonthTo' as const;

const STATUS_OPTIONS: PayrollRunStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'PAYING', 'CLOSED'];

export type PayrollFilterLabelKey =
  | 'filters.status'
  | 'filters.monthFrom'
  | 'filters.monthTo'
  | 'filters.allStatus'
  | 'filters.allMonths'
  | (typeof PAYROLL_RUN_STATUS_MESSAGE_KEY)[PayrollRunStatus];

export type PayrollFilterTranslator = (key: PayrollFilterLabelKey) => string;

export function buildPayrollMonthRangeFilterConfigs(t: PayrollFilterTranslator): FilterConfig[] {
  return buildPayrollIntegratedFilterConfigs(t).filter((item) => item.fieldType === 'month');
}

export function buildPayrollIntegratedFilterConfigs(t: PayrollFilterTranslator): FilterConfig[] {
  return [
    {
      key: PAYROLL_FILTER_STATUS_KEY,
      label: t('filters.status'),
      allOptionLabel: t('filters.allStatus'),
      options: STATUS_OPTIONS.map((status) => ({
        value: status,
        label: t(PAYROLL_RUN_STATUS_MESSAGE_KEY[status]),
      })),
    },
    {
      key: PAYROLL_FILTER_MONTH_FROM_KEY,
      label: t('filters.monthFrom'),
      allOptionLabel: t('filters.allMonths'),
      fieldType: 'month',
      options: [],
    },
    {
      key: PAYROLL_FILTER_MONTH_TO_KEY,
      label: t('filters.monthTo'),
      allOptionLabel: t('filters.allMonths'),
      fieldType: 'month',
      options: [],
    },
  ];
}

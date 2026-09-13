'use client';

import { CalendarRange, LayoutGrid, List, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ViewModeOption } from '@/components/shared';
import { createPersistedScalarStore } from '@/lib/persisted-client-state';
import type { PayrollMatrixViewMode } from '@/lib/api/payroll-allocation-matrix';

export type PayrollRunDetailViewMode =
  | 'SALARY_LINES'
  | 'EMPLOYEE_BONUS_HISTORY'
  | PayrollMatrixViewMode;

const DEFAULT_VIEW_MODE: PayrollRunDetailViewMode = 'EMPLOYEE_MATRIX';

const DETAIL_VIEW_ICONS = {
  salaryLines: <List className="size-3.5 shrink-0" aria-hidden />,
  employeeMatrix: <Users className="size-3.5 shrink-0" aria-hidden />,
  orderMatrix: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
  employeeHistory: <CalendarRange className="size-3.5 shrink-0" aria-hidden />,
} as const;

const DETAIL_VIEW_OPTION_EN = {
  'detailView.salaryLines': 'Salary lines',
  'detailView.salaryLinesAria': 'Employee salary lines for this payroll run',
  'detailView.employeeMatrix': 'Employee × Order',
  'detailView.employeeMatrixAria': 'Employees as rows, orders as columns',
  'detailView.orderMatrix': 'Order × Employees',
  'detailView.orderMatrixAria': 'Orders as rows, employees as columns',
  'detailView.employeeHistory': 'Employee history',
  'detailView.employeeHistoryAria': 'Employee projects across last twelve payroll months',
} as const;

type DetailViewLabelKey = keyof typeof DETAIL_VIEW_OPTION_EN;

export function getPayrollRunDetailViewOptions(
  t: (key: DetailViewLabelKey) => string,
): ViewModeOption<PayrollRunDetailViewMode>[] {
  return [
    {
      value: 'SALARY_LINES',
      label: t('detailView.salaryLines'),
      icon: DETAIL_VIEW_ICONS.salaryLines,
      ariaLabel: t('detailView.salaryLinesAria'),
    },
    {
      value: 'EMPLOYEE_MATRIX',
      label: t('detailView.employeeMatrix'),
      icon: DETAIL_VIEW_ICONS.employeeMatrix,
      ariaLabel: t('detailView.employeeMatrixAria'),
    },
    {
      value: 'ORDER_MATRIX',
      label: t('detailView.orderMatrix'),
      icon: DETAIL_VIEW_ICONS.orderMatrix,
      ariaLabel: t('detailView.orderMatrixAria'),
    },
    {
      value: 'EMPLOYEE_BONUS_HISTORY',
      label: t('detailView.employeeHistory'),
      icon: DETAIL_VIEW_ICONS.employeeHistory,
      ariaLabel: t('detailView.employeeHistoryAria'),
    },
  ];
}

export function usePayrollRunDetailViewOptions(): ViewModeOption<PayrollRunDetailViewMode>[] {
  const t = useTranslations('payroll');
  return getPayrollRunDetailViewOptions((key) => t(key));
}

/** English fallback for surfaces that are not yet on the payroll namespace. */
export const PAYROLL_RUN_DETAIL_VIEW_OPTIONS: ViewModeOption<PayrollRunDetailViewMode>[] =
  getPayrollRunDetailViewOptions((key) => DETAIL_VIEW_OPTION_EN[key]);

export function isPayrollMatrixViewMode(
  mode: PayrollRunDetailViewMode,
): mode is PayrollMatrixViewMode {
  return mode === 'EMPLOYEE_MATRIX' || mode === 'ORDER_MATRIX';
}

export function isPayrollRunFullscreenViewMode(mode: PayrollRunDetailViewMode): boolean {
  return isPayrollMatrixViewMode(mode) || mode === 'EMPLOYEE_BONUS_HISTORY';
}

function isPayrollRunDetailViewMode(value: string | null): value is PayrollRunDetailViewMode {
  return (
    value === 'SALARY_LINES' ||
    value === 'EMPLOYEE_BONUS_HISTORY' ||
    value === 'EMPLOYEE_MATRIX' ||
    value === 'ORDER_MATRIX'
  );
}

const payrollRunDetailViewStore = createPersistedScalarStore<PayrollRunDetailViewMode>({
  storageKey: 'nbos:finance:payroll-run-detail-view',
  defaultValue: DEFAULT_VIEW_MODE,
  parse: (raw) => (isPayrollRunDetailViewMode(raw) ? raw : DEFAULT_VIEW_MODE),
});

export const readPayrollRunDetailViewMode = payrollRunDetailViewStore.read;
export const writePayrollRunDetailViewMode = payrollRunDetailViewStore.write;
export const usePayrollRunDetailViewMode = payrollRunDetailViewStore.useValue;

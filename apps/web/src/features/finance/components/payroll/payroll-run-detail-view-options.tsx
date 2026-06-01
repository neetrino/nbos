import { CalendarRange, LayoutGrid, List, Users } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { PayrollMatrixViewMode } from '@/lib/api/payroll-allocation-matrix';

export type PayrollRunDetailViewMode =
  | 'SALARY_LINES'
  | 'EMPLOYEE_BONUS_HISTORY'
  | PayrollMatrixViewMode;

const STORAGE_KEY = 'nbos:finance:payroll-run-detail-view';
const DEFAULT_VIEW_MODE: PayrollRunDetailViewMode = 'EMPLOYEE_MATRIX';

export const PAYROLL_RUN_DETAIL_VIEW_OPTIONS: ViewModeOption<PayrollRunDetailViewMode>[] = [
  {
    value: 'SALARY_LINES',
    label: 'Salary lines',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Employee salary lines for this payroll run',
  },
  {
    value: 'EMPLOYEE_MATRIX',
    label: 'Employee × Order',
    icon: <Users className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Employees as rows, orders as columns',
  },
  {
    value: 'ORDER_MATRIX',
    label: 'Order × Employees',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Orders as rows, employees as columns',
  },
  {
    value: 'EMPLOYEE_BONUS_HISTORY',
    label: 'Employee history',
    icon: <CalendarRange className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Employee projects across last twelve payroll months',
  },
];

export function isPayrollMatrixViewMode(
  mode: PayrollRunDetailViewMode,
): mode is PayrollMatrixViewMode {
  return mode === 'EMPLOYEE_MATRIX' || mode === 'ORDER_MATRIX';
}

export function isPayrollRunFullscreenViewMode(mode: PayrollRunDetailViewMode): boolean {
  return isPayrollMatrixViewMode(mode) || mode === 'EMPLOYEE_BONUS_HISTORY';
}

export function readPayrollRunDetailViewMode(): PayrollRunDetailViewMode {
  if (typeof window === 'undefined') {
    return DEFAULT_VIEW_MODE;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return isPayrollRunDetailViewMode(raw) ? raw : DEFAULT_VIEW_MODE;
}

export function writePayrollRunDetailViewMode(mode: PayrollRunDetailViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}

function isPayrollRunDetailViewMode(value: string | null): value is PayrollRunDetailViewMode {
  return (
    value === 'SALARY_LINES' ||
    value === 'EMPLOYEE_BONUS_HISTORY' ||
    value === 'EMPLOYEE_MATRIX' ||
    value === 'ORDER_MATRIX'
  );
}

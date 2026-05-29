import { LayoutGrid, List, Users } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { PayrollMatrixViewMode } from '@/lib/api/payroll-allocation-matrix';

export type PayrollRunDetailViewMode = 'SALARY_LINES' | PayrollMatrixViewMode;

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
];

export function isPayrollMatrixViewMode(
  mode: PayrollRunDetailViewMode,
): mode is PayrollMatrixViewMode {
  return mode === 'EMPLOYEE_MATRIX' || mode === 'ORDER_MATRIX';
}

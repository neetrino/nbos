import { LayoutGrid, Users } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { PayrollMatrixViewMode } from '@/lib/api/payroll-allocation-matrix';

export const PAYROLL_ALLOCATION_MATRIX_VIEW_OPTIONS: ViewModeOption<PayrollMatrixViewMode>[] = [
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

import { Calendar, Columns3, LayoutGrid, List, Users } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { BonusBoardViewMode } from '@/features/finance/constants/bonus-board-view';

export const BONUS_BOARD_VIEW_OPTIONS: ViewModeOption<BonusBoardViewMode>[] = [
  {
    value: 'board',
    label: 'Board',
    icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Status board view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
  {
    value: 'employee',
    label: 'Employee',
    icon: <Users className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Group by employee',
  },
  {
    value: 'product',
    label: 'Product',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Group by project',
  },
  {
    value: 'payroll',
    label: 'Payroll',
    icon: <Calendar className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Payroll month preview',
  },
];

import { Columns3, LayoutGrid, List, Rows3 } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { SalaryBoardViewMode } from '@/features/finance/constants/salary-board-view';

export const SALARY_BOARD_VIEW_OPTIONS: ViewModeOption<SalaryBoardViewMode>[] = [
  {
    value: 'grid',
    label: 'Grid',
    icon: <Rows3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Employee by month grid',
  },
  {
    value: 'cards',
    label: 'Cards',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Employee cards view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Flat list view',
  },
  {
    value: 'board',
    label: 'Board',
    icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Board by payout phase',
  },
];

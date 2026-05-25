import { CalendarDays, Columns3, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { SalaryBoardViewMode } from '@/features/finance/constants/salary-board-view';

export const SALARY_BOARD_VIEW_OPTIONS: ViewModeOption<SalaryBoardViewMode>[] = [
  {
    value: 'calendar',
    label: 'Calendar',
    icon: <CalendarDays className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Employee salary calendar by month',
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

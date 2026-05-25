import { CalendarDays, Columns3, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { ExpensePlansViewMode } from '@/features/finance/constants/expense-plans-view';

export const EXPENSE_PLANS_VIEW_OPTIONS: ViewModeOption<ExpensePlansViewMode>[] = [
  {
    value: 'grid',
    label: 'Grid',
    icon: <CalendarDays className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Calendar grid view',
  },
  {
    value: 'board',
    label: 'Board',
    icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Board by frequency',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

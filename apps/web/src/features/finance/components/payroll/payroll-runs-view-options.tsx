import { CalendarDays, Columns3, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { PayrollRunsListViewMode } from '@/features/finance/constants/payroll-runs-list-view';

export const PAYROLL_RUNS_VIEW_OPTIONS: ViewModeOption<PayrollRunsListViewMode>[] = [
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Payroll runs table list',
  },
  {
    value: 'board',
    label: 'Board',
    icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Kanban board by run status',
  },
  {
    value: 'calendar',
    label: 'Calendar',
    icon: <CalendarDays className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Year by month calendar grid',
  },
];

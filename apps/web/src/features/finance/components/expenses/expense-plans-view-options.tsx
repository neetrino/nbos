import { CalendarDays, Columns3, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { ExpensePlansViewMode } from '@/features/finance/constants/expense-plans-view';
import type { ExpensePlansTranslate } from './expense-plan-message-keys';

export function buildExpensePlansViewOptions(
  t: ExpensePlansTranslate,
): ViewModeOption<ExpensePlansViewMode>[] {
  return [
    {
      value: 'grid',
      label: t('view.grid'),
      icon: <CalendarDays className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: t('view.gridAria'),
    },
    {
      value: 'board',
      label: t('view.board'),
      icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: t('view.boardAria'),
    },
    {
      value: 'list',
      label: t('view.list'),
      icon: <List className="size-3.5 shrink-0" aria-hidden />,
      ariaLabel: t('view.listAria'),
    },
  ];
}

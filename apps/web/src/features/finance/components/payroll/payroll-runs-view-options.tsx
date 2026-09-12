'use client';

import { CalendarDays, Columns3, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ViewModeOption } from '@/components/shared';
import type { PayrollRunsListViewMode } from '@/features/finance/constants/payroll-runs-list-view';

const PAYROLL_RUNS_VIEW_ICONS = {
  list: <List className="size-3.5 shrink-0" aria-hidden />,
  board: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
  calendar: <CalendarDays className="size-3.5 shrink-0" aria-hidden />,
} as const;

const PAYROLL_RUNS_VIEW_OPTION_EN = {
  'view.list': 'List',
  'view.board': 'Board',
  'view.calendar': 'Calendar',
  'view.listAria': 'Payroll runs table list',
  'view.boardAria': 'Kanban board by run status',
  'view.calendarAria': 'Year by month calendar grid',
} as const;

type PayrollRunsViewLabelKey = keyof typeof PAYROLL_RUNS_VIEW_OPTION_EN;

export function getPayrollRunsViewOptions(
  t: (key: PayrollRunsViewLabelKey) => string,
): ViewModeOption<PayrollRunsListViewMode>[] {
  return [
    {
      value: 'list',
      label: t('view.list'),
      icon: PAYROLL_RUNS_VIEW_ICONS.list,
      ariaLabel: t('view.listAria'),
    },
    {
      value: 'board',
      label: t('view.board'),
      icon: PAYROLL_RUNS_VIEW_ICONS.board,
      ariaLabel: t('view.boardAria'),
    },
    {
      value: 'calendar',
      label: t('view.calendar'),
      icon: PAYROLL_RUNS_VIEW_ICONS.calendar,
      ariaLabel: t('view.calendarAria'),
    },
  ];
}

export function usePayrollRunsViewOptions(): ViewModeOption<PayrollRunsListViewMode>[] {
  const t = useTranslations('payroll');
  return getPayrollRunsViewOptions((key) => t(key));
}

/** English fallback for surfaces that are not yet on the payroll namespace. */
export const PAYROLL_RUNS_VIEW_OPTIONS: ViewModeOption<PayrollRunsListViewMode>[] =
  getPayrollRunsViewOptions((key) => PAYROLL_RUNS_VIEW_OPTION_EN[key]);

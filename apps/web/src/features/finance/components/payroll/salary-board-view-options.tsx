'use client';

import { CalendarDays, Columns3, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ViewModeOption } from '@/components/shared';
import type { SalaryBoardViewMode } from '@/features/finance/constants/salary-board-view';

const SALARY_BOARD_VIEW_ICONS = {
  calendar: <CalendarDays className="size-3.5 shrink-0" aria-hidden />,
  list: <List className="size-3.5 shrink-0" aria-hidden />,
  board: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
} as const;

const SALARY_BOARD_VIEW_OPTION_EN = {
  'salaryView.calendar': 'Calendar',
  'salaryView.calendarAria': 'Employee salary calendar by month',
  'salaryView.list': 'List',
  'salaryView.listAria': 'Flat list view',
  'salaryView.board': 'Board',
  'salaryView.boardAria': 'Board by payout phase',
} as const;

type SalaryBoardViewLabelKey = keyof typeof SALARY_BOARD_VIEW_OPTION_EN;

export function getSalaryBoardViewOptions(
  t: (key: SalaryBoardViewLabelKey) => string,
): ViewModeOption<SalaryBoardViewMode>[] {
  return [
    {
      value: 'calendar',
      label: t('salaryView.calendar'),
      icon: SALARY_BOARD_VIEW_ICONS.calendar,
      ariaLabel: t('salaryView.calendarAria'),
    },
    {
      value: 'list',
      label: t('salaryView.list'),
      icon: SALARY_BOARD_VIEW_ICONS.list,
      ariaLabel: t('salaryView.listAria'),
    },
    {
      value: 'board',
      label: t('salaryView.board'),
      icon: SALARY_BOARD_VIEW_ICONS.board,
      ariaLabel: t('salaryView.boardAria'),
    },
  ];
}

export function useSalaryBoardViewOptions(): ViewModeOption<SalaryBoardViewMode>[] {
  const t = useTranslations('payroll');
  return getSalaryBoardViewOptions((key) => t(key));
}

/** English fallback for surfaces that are not yet on the payroll namespace. */
export const SALARY_BOARD_VIEW_OPTIONS: ViewModeOption<SalaryBoardViewMode>[] =
  getSalaryBoardViewOptions((key) => SALARY_BOARD_VIEW_OPTION_EN[key]);

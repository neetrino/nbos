'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ViewModeOption } from '@/components/shared';
import type { InvoiceViewMode } from './invoice-page-types';

const INVOICE_VIEW_OPTION_ICONS = {
  kanban: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
  list: <List className="size-3.5 shrink-0" aria-hidden />,
} as const;

const INVOICE_VIEW_OPTION_EN = {
  'view.board': 'Board',
  'view.list': 'List',
  'view.boardAria': 'Kanban board view',
  'view.listAria': 'List view',
} as const;

type InvoiceViewLabelKey = keyof typeof INVOICE_VIEW_OPTION_EN;

export function getInvoiceViewOptions(
  t: (key: InvoiceViewLabelKey) => string,
): ViewModeOption<InvoiceViewMode>[] {
  return [
    {
      value: 'kanban',
      label: t('view.board'),
      icon: INVOICE_VIEW_OPTION_ICONS.kanban,
      ariaLabel: t('view.boardAria'),
    },
    {
      value: 'list',
      label: t('view.list'),
      icon: INVOICE_VIEW_OPTION_ICONS.list,
      ariaLabel: t('view.listAria'),
    },
  ];
}

export function useInvoiceViewOptions(): ViewModeOption<InvoiceViewMode>[] {
  const t = useTranslations('invoices');
  return getInvoiceViewOptions((key) => t(key));
}

/** English fallback for surfaces that are not yet on the invoices namespace. */
export const INVOICE_VIEW_OPTIONS: ViewModeOption<InvoiceViewMode>[] = getInvoiceViewOptions(
  (key) => INVOICE_VIEW_OPTION_EN[key],
);

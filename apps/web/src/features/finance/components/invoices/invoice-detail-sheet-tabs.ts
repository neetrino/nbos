import { CreditCard, History, LayoutGrid } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

const INVOICE_DETAIL_SHEET_TAB_EN = {
  'tabs.general': 'General',
  'tabs.payments': 'Payments',
  'tabs.history': 'History',
} as const;

type InvoiceDetailTabLabelKey = keyof typeof INVOICE_DETAIL_SHEET_TAB_EN;

export function getInvoiceDetailSheetTabs(
  t: (key: InvoiceDetailTabLabelKey) => string,
): readonly DetailSheetTabItem[] {
  return [
    { value: 'general', label: t('tabs.general'), icon: LayoutGrid },
    { value: 'payments', label: t('tabs.payments'), icon: CreditCard },
    { value: 'history', label: t('tabs.history'), icon: History },
  ] as const satisfies readonly DetailSheetTabItem[];
}

export const INVOICE_DETAIL_SHEET_TABS = getInvoiceDetailSheetTabs(
  (key) => INVOICE_DETAIL_SHEET_TAB_EN[key],
);

export type InvoiceDetailSheetTab = (typeof INVOICE_DETAIL_SHEET_TABS)[number]['value'];

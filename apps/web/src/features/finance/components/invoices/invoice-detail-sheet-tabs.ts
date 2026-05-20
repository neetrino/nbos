import { CreditCard, History, LayoutGrid } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const INVOICE_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'payments', label: 'Payments', icon: CreditCard },
  { value: 'history', label: 'History', icon: History },
] as const satisfies readonly DetailSheetTabItem[];

export type InvoiceDetailSheetTab = (typeof INVOICE_DETAIL_SHEET_TABS)[number]['value'];

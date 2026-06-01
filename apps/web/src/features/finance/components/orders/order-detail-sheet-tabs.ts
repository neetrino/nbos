import { FileText, LayoutGrid, Scale } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const ORDER_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'invoices', label: 'Invoices', icon: FileText },
  { value: 'reconciliation', label: 'Reconciliation', icon: Scale },
] as const satisfies readonly DetailSheetTabItem[];

export type OrderDetailSheetTab = (typeof ORDER_DETAIL_SHEET_TABS)[number]['value'];

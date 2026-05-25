import { FileText, History, LayoutGrid } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const SUBSCRIPTION_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'invoice', label: 'Invoices', icon: FileText },
  { value: 'history', label: 'History', icon: History },
] as const satisfies readonly DetailSheetTabItem[];

export type SubscriptionDetailSheetTab = (typeof SUBSCRIPTION_DETAIL_SHEET_TABS)[number]['value'];

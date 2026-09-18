import { LayoutGrid } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const PAYMENT_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
] as const satisfies readonly DetailSheetTabItem[];

export type PaymentDetailSheetTab = (typeof PAYMENT_DETAIL_SHEET_TABS)[number]['value'];

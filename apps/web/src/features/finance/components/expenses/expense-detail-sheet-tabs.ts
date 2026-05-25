import { CreditCard, LayoutGrid } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const EXPENSE_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'payments', label: 'Payments', icon: CreditCard },
] as const satisfies readonly DetailSheetTabItem[];

export type ExpenseDetailSheetTab = (typeof EXPENSE_DETAIL_SHEET_TABS)[number]['value'];

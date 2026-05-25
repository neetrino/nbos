import { CalendarDays, History, Receipt } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const EXPENSE_PLAN_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General', icon: CalendarDays },
  { value: 'cards', label: 'Cards', icon: Receipt },
  { value: 'history', label: 'History', icon: History },
] as const satisfies readonly DetailSheetTabItem[];

export type ExpensePlanDetailSheetTab = (typeof EXPENSE_PLAN_DETAIL_SHEET_TABS)[number]['value'];

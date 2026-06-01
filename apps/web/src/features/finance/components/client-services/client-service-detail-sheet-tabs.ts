import { CheckSquare, FileText, LayoutGrid, Receipt } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const CLIENT_SERVICE_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'invoices', label: 'Invoices', icon: FileText },
  { value: 'expenses', label: 'Expenses', icon: Receipt },
  { value: 'tasks', label: 'Tasks', icon: CheckSquare },
] as const satisfies readonly DetailSheetTabItem[];

export type ClientServiceDetailSheetTab =
  (typeof CLIENT_SERVICE_DETAIL_SHEET_TABS)[number]['value'];

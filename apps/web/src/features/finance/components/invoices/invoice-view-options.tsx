import { LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { InvoiceViewMode } from './invoice-page-types';

export const INVOICE_VIEW_OPTIONS: ViewModeOption<InvoiceViewMode>[] = [
  {
    value: 'kanban',
    label: 'Board',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Kanban board view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

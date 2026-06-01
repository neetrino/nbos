import { LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { OrderViewMode } from './order-page-types';

export const ORDER_VIEW_OPTIONS: ViewModeOption<OrderViewMode>[] = [
  {
    value: 'board',
    label: 'Board',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Status board view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

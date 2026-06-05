import { LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';

export type PartnersDirectoryViewMode = 'list' | 'grid';

export const PARTNERS_DIRECTORY_VIEW_OPTIONS: ViewModeOption<PartnersDirectoryViewMode>[] = [
  {
    value: 'grid',
    label: 'Grid',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Card grid view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

import { LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { ProjectDetailViewMode } from '@/features/projects/components/project-detail-layout.constants';

export const PRODUCT_TAB_VIEW_OPTIONS: ViewModeOption<ProjectDetailViewMode>[] = [
  {
    value: 'card',
    label: 'Cards',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Card view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

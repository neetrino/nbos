import { Columns3, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { BonusPoolsViewMode } from '@/features/finance/constants/bonus-pools-view';

export const BONUS_POOLS_VIEW_OPTIONS: ViewModeOption<BonusPoolsViewMode>[] = [
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Product bonus pools list',
  },
  {
    value: 'board',
    label: 'Board',
    icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Funding status board',
  },
];

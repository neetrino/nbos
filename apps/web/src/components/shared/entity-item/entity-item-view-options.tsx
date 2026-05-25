import { LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '../page-hero/ViewModeSwitch';
import type { EntityItemVariant } from './entity-item.types';

export const ENTITY_ITEM_VIEW_OPTIONS: ViewModeOption<EntityItemVariant>[] = [
  {
    value: 'list-row',
    label: 'List',
    icon: <List size={14} aria-hidden />,
    ariaLabel: 'List view',
  },
  {
    value: 'compact-card',
    label: 'Cards',
    icon: <LayoutGrid size={14} aria-hidden />,
    ariaLabel: 'Card view',
  },
];

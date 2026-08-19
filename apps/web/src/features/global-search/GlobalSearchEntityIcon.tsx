'use client';

import { cn } from '@/lib/utils';
import type { SearchEntityType } from '@/lib/api/search';
import {
  GLOBAL_SEARCH_ENTITY_ICONS,
  GLOBAL_SEARCH_ENTITY_VISUALS,
} from './global-search-presenters';

interface GlobalSearchEntityIconProps {
  entityType: SearchEntityType;
  className?: string;
  /** Soft colored tile behind the glyph (search result rows). */
  withTile?: boolean;
}

export function GlobalSearchEntityIcon({
  entityType,
  className,
  withTile = false,
}: GlobalSearchEntityIconProps) {
  const Icon = GLOBAL_SEARCH_ENTITY_ICONS[entityType];
  const { iconClass, tileClass } = GLOBAL_SEARCH_ENTITY_VISUALS[entityType];

  if (!withTile) {
    return <Icon className={cn(iconClass, className)} aria-hidden />;
  }

  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full',
        tileClass,
        className,
      )}
      aria-hidden
    >
      <Icon className={cn('size-4', iconClass)} />
    </span>
  );
}

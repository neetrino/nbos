'use client';

import type { SearchEntityType } from '@/lib/api/search';
import { GLOBAL_SEARCH_ENTITY_ICONS } from './global-search-presenters';

interface GlobalSearchEntityIconProps {
  entityType: SearchEntityType;
  className?: string;
}

export function GlobalSearchEntityIcon({ entityType, className }: GlobalSearchEntityIconProps) {
  const Icon = GLOBAL_SEARCH_ENTITY_ICONS[entityType];
  return <Icon className={className} aria-hidden />;
}

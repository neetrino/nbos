'use client';

import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { cn } from '@/lib/utils';
import { ENTITY_ITEM_LIST_GAP_CLASS } from './entity-item-classes';
import { EntityItemSurface } from './EntityItemSurface';
import type { EntityItemSummary, EntityItemVariant } from './entity-item.types';

export interface EntityItemListProps {
  items: EntityItemSummary[];
  variant?: EntityItemVariant;
  onOpen: (item: EntityItemSummary) => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon: LucideIcon;
  className?: string;
  gridClassName?: string;
}

export function EntityItemList({
  items,
  variant = 'list-row',
  onOpen,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  className,
  gridClassName,
}: EntityItemListProps) {
  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  if (variant === 'compact-card') {
    return (
      <div className={cn('grid gap-3 sm:grid-cols-2', gridClassName, className)}>
        {items.map((item) => (
          <EntityItemSurface
            key={`${item.kind}-${item.id}`}
            item={item}
            variant={variant}
            onOpen={onOpen}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(ENTITY_ITEM_LIST_GAP_CLASS, className)}>
      {items.map((item) => (
        <EntityItemSurface
          key={`${item.kind}-${item.id}`}
          item={item}
          variant={variant}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
